import FileMetadata from "../models/FileMetadata.js";
import UserCredits from "../models/UserCredits.js";
import {
  S3Client,
  DeleteObjectCommand,
  PutObjectAclCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";
import path from "path";

// Configure S3 client
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = process.env.AWS_BUCKET_NAME;
const randomBytes = (bytes = 16) => crypto.randomBytes(bytes).toString("hex");

// 1. Generate Presigned URL for direct upload
export const getPresignedUrlForUpload = async (req, res) => {
  try {
    const { fileName, fileType } = req.body;
    if (!fileName || !fileType) {
      return res.status(400).json({ error: "fileName and fileType are required" });
    }

    const key = `uploads/${randomBytes()}${path.extname(fileName)}`;

    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: fileType,
    });

    const url = await getSignedUrl(s3, command, { expiresIn: 300 }); // URL expires in 5 minutes

    res.json({ url, key });
  } catch (err) {
    console.error("Error generating presigned URL:", err);
    res.status(500).json({ error: "Error generating upload URL" });
  }
};

// 2. Confirm upload and save metadata (replaces old uploadFiles)
export const uploadFiles = async (req, res) => {
  try {
    const { files } = req.body; // Array of file metadata from client
    const clerkId = req.user.sub;

    if (!files || files.length === 0) {
      return res.status(400).json({ error: "No files to confirm" });
    }

    let userCredits = await UserCredits.findOne({ clerkId });
    if (!userCredits) {
      userCredits = await UserCredits.create({ clerkId, credits: 20, plan: "BASIC" });
    }

    if (userCredits.credits < files.length) {
      return res.status(400).json({ error: "Not enough credits" });
    }

    const savedFiles = [];
    for (const file of files) {
      const fileUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${file.key}`;
      const fileData = await FileMetadata.create({
        fileLocation: fileUrl,
        name: file.name,
        size: file.size,
        type: file.type,
        clerkId,
        isPublic: false, // Default to private
        s3Key: file.key,
      });
      savedFiles.push(fileData);
      userCredits.credits -= 1;
    }

    await userCredits.save();
    res.status(201).json({ files: savedFiles, remainingCredits: userCredits.credits });
  } catch (err) {
    console.error("Error confirming upload:", err);
    res.status(500).json({ error: "Error saving file metadata" });
  }
};

// 3. Get a temporary URL to view a private file
export const getPresignedUrlForView = async (req, res) => {
  try {
    const clerkId = req.user.sub;
    const file = await FileMetadata.findById(req.params.id);

    if (!file || file.clerkId !== clerkId) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: file.s3Key,
      ResponseContentDisposition: "inline", // Tell browser to display inline
      ResponseContentType: file.type, // Set the correct content type
    });

    const url = await getSignedUrl(s3, command, { expiresIn: 300 }); // Link expires in 5 minutes
    res.json({ url });
  } catch (err) {
    res.status(500).json({ error: "Error generating view link" });
  }
};

// 4. Delete file from S3 and DB
export const deleteFile = async (req, res) => {
  try {
    const clerkId = req.user.sub;
    const file = await FileMetadata.findById(req.params.id);

    if (!file || file.clerkId !== clerkId) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: file.s3Key,
    });
    await s3.send(command);

    await file.deleteOne();
    res.sendStatus(204);
  } catch (err) {
    console.error("Error deleting file:", err);
    res.status(500).json({ error: "Error deleting file" });
  }
};

// 5. Toggle public/private by changing S3 object ACL
export const togglePublic = async (req, res) => {
  try {
    const clerkId = req.user.sub;
    const file = await FileMetadata.findById(req.params.id);

    if (!file || file.clerkId !== clerkId) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const newPublicStatus = !file.isPublic;
    const command = new PutObjectAclCommand({
      Bucket: BUCKET_NAME,
      Key: file.s3Key,
      ACL: newPublicStatus ? "public-read" : "private",
    });
    await s3.send(command);

    file.isPublic = newPublicStatus;
    await file.save();
    res.json(file);
  } catch (err) {
    console.error("Error toggling public status:", err);
    res.status(500).json({ error: "Error toggling public status" });
  }
};
