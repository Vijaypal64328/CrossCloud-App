import FileMetadata from "../models/FileMetadata.js";
import UserCredits from "../models/UserCredits.js";
import {
  S3Client,
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectAclCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import crypto from "crypto";

// Configure S3 client for delete operations
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Generate a presigned URL for direct upload
export const getPresignedUrl = async (req, res) => {
  const { fileName, fileType } = req.body;
  const clerkId = req.user.sub;

  // Generate a unique key for the file in S3
  const s3Key = `uploads/${clerkId}/${Date.now()}-${fileName}`;

  try {
    const { url, fields } = await createPresignedPost(s3, {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: s3Key,
      Conditions: [
        ["content-length-range", 0, 52428800], // up to 50 MB
        ["eq", "$Content-Type", fileType],
      ],
      Fields: {
        "Content-Type": fileType,
      },
      Expires: 600, // 10 minutes
    });

    res.json({ url, fields, s3Key });
  } catch (err) {
    console.error("Error creating presigned post:", err);
    res.status(500).json({ error: "Error creating presigned URL" });
  }
};

// Register the file metadata after a successful direct upload
export const registerUploadedFile = async (req, res) => {
  const { s3Key, fileName, fileType, fileSize } = req.body;
  const clerkId = req.user.sub;

  try {
    let userCredits = await UserCredits.findOne({ clerkId });
    if (!userCredits || userCredits.credits < 1) {
      return res.status(400).json({ error: "Not enough credits" });
    }

    const fileData = await FileMetadata.create({
      fileLocation: `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`, // Construct the URL
      name: fileName,
      size: fileSize,
      type: fileType,
      clerkId,
      isPublic: false, // Private by default
      s3Key: s3Key,
      uploadedAt: new Date(),
    });

    userCredits.credits -= 1;
    await userCredits.save();

    res.status(201).json({ file: fileData, remainingCredits: userCredits.credits });
  } catch (err) {
    console.error("Error registering file:", err);
    res.status(500).json({ error: "Error registering file" });
  }
};

// Get a presigned URL to preview a private file
export const getPreviewUrl = async (req, res) => {
  try {
    const clerkId = req.user.sub;
    const file = await FileMetadata.findById(req.params.id);

    if (!file) {
      return res.status(404).json({ error: "File not found" });
    }

    // If public, return the direct S3 URL
    if (file.isPublic) {
      return res.json({ url: file.fileLocation });
    }

    // If private, only the owner can get a preview link
    if (file.clerkId !== clerkId) {
      return res.status(403).json({ error: "Not authorized" });
    }

    // Generate a presigned GET URL for the private file
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: file.s3Key,
      ResponseContentDisposition: "inline", // Important for previewing in browser
    });

    const signedUrl = await getSignedUrl(s3, command, { expiresIn: 300 }); // URL expires in 5 minutes
    res.json({ url: signedUrl });
  } catch (err) {
    console.error("Error generating preview URL:", err);
    res.status(500).json({ error: "Error generating preview URL" });
  }
};

// Upload multiple files (now using S3) - THIS IS NOW DEPRECATED
// The new flow is getPresignedUrl -> direct upload -> registerUploadedFile
export const uploadFiles = async (req, res) => {
  try {
    const files = req.files;
    const clerkId = req.user.sub;

    if (!files || files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    let userCredits = await UserCredits.findOne({ clerkId });
    if (!userCredits) {
      userCredits = await UserCredits.create({
        clerkId,
        credits: 20,
        plan: "BASIC",
      });
    }

    if (userCredits.credits < files.length) {
      return res.status(400).json({ error: "Not enough credits" });
    }

    const savedFiles = [];

    for (let file of files) {
      const fileData = await FileMetadata.create({
        fileLocation: file.location, // S3 URL
        name: file.originalname,
        size: file.size,
        type: file.mimetype,
        clerkId,
        isPublic: true, // Files on S3 are public by default with our ACL
        uploadedAt: new Date(),
        s3Key: file.key, // Store the S3 key for deletion
      });

      savedFiles.push(fileData);
      userCredits.credits -= 1;
    }

    await userCredits.save();

    res.json({
      files: savedFiles,
      remainingCredits: userCredits.credits,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error uploading files" });
  }
};

// Get user's own files
export const getMyFiles = async (req, res) => {
  try {
    const clerkId = req.user.sub;
    const files = await FileMetadata.find({ clerkId });
    res.json(files);
  } catch (err) {
    res.status(500).json({ error: "Error fetching files" });
  }
};

// Get public file metadata
export const getPublicFile = async (req, res) => {
  try {
    const file = await FileMetadata.findById(req.params.id);
    if (!file || !file.isPublic) {
      return res.status(404).json({ error: "File not found" });
    }
    res.json(file);
  } catch (err) {
    res.status(500).json({ error: "Error fetching public file" });
  }
};

// Delete a file (now from S3)
export const deleteFile = async (req, res) => {
  try {
    const clerkId = req.user.sub;
    const file = await FileMetadata.findById(req.params.id);

    if (!file || file.clerkId !== clerkId) {
      return res.status(403).json({ error: "Not authorized" });
    }

    // Delete from S3
    const deleteParams = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: file.s3Key,
    };
    await s3.send(new DeleteObjectCommand(deleteParams));

    // Delete from database
    await FileMetadata.findByIdAndDelete(req.params.id);

    res.sendStatus(204);
  } catch (err) {
    console.error("Error deleting file:", err);
    res.status(500).json({ error: "Error deleting file" });
  }
};

// Toggle public/private (ACL change on S3)
export const togglePublic = async (req, res) => {
  try {
    const file = await FileMetadata.findById(req.params.id);
    if (!file) {
      return res.status(404).json({ error: "File not found" });
    }

    file.isPublic = !file.isPublic;

    // Update the ACL on the S3 object
    const command = new PutObjectAclCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: file.s3Key,
      ACL: file.isPublic ? "public-read" : "private",
    });
    await s3.send(command);

    await file.save();
    res.json(file);
  } catch (err) {
    console.error("Error toggling public status:", err);
    res.status(500).json({ error: "Error toggling public status" });
  }
};
