import FileMetadata from "../models/FileMetadata.js";
import UserCredits from "../models/UserCredits.js";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";

// Configure S3 client for delete operations
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Upload multiple files (now using S3)
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
    await file.deleteOne();

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
    await file.save();
    res.json(file);
  } catch (err) {
    res.status(500).json({ error: "Error toggling public status" });
  }
};
