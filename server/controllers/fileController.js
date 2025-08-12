import path from "path";
import fs from "fs";
import FileMetadata from "../models/FileMetadata.js";
import UserCredits from "../models/UserCredits.js";

// Helper to get uploads directory
const getUploadsDir = () => path.join(process.cwd(), "server", "uploads");

// Upload multiple files
export const uploadFiles = async (req, res) => {
  try {
    const files = req.files;
    const clerkId = req.user.sub; // Clerk user ID

    if (!files || files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    // Get user credits
    let userCredits = await UserCredits.findOne({ clerkId });
    if (!userCredits) {
      userCredits = await UserCredits.create({
        clerkId,
        credits: 20, // initial free credits
        plan: "BASIC",
      });
    }

    // Check if enough credits
    if (userCredits.credits < files.length) {
      return res.status(400).json({ error: "Not enough credits" });
    }

    const savedFiles = [];

    for (let file of files) {
      // Store only the filename, not the full path
      const fileData = await FileMetadata.create({
        fileLocation: file.filename, // only filename
        name: file.originalname,
        size: file.size,
        type: file.mimetype,
        clerkId,
        isPublic: false,
        uploadedAt: new Date(),
      });

      savedFiles.push(fileData);
      userCredits.credits -= 1; // Deduct 1 credit per file
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

// Download a file
export const downloadFile = async (req, res) => {
  try {
    const file = await FileMetadata.findById(req.params.id);
    if (!file) {
      return res.status(404).json({ error: "File not found" });
    }
    const uploadsDir = getUploadsDir();
    const filePath = path.join(uploadsDir, file.fileLocation);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found on server" });
    }
    res.download(filePath, file.name);
  } catch (err) {
    res.status(500).json({ error: "Error downloading file" });
  }
};

// Delete a file
export const deleteFile = async (req, res) => {
  try {
    const clerkId = req.user.sub;
    const file = await FileMetadata.findById(req.params.id);
    if (!file || file.clerkId !== clerkId) {
      return res.status(403).json({ error: "Not authorized" });
    }
    const uploadsDir = getUploadsDir();
    const filePath = path.join(uploadsDir, file.fileLocation);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    await file.deleteOne();
    res.sendStatus(204);
  } catch (err) {
    res.status(500).json({ error: "Error deleting file" });
  }
};

// Toggle public/private
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
