import path from "path";
import fs from "fs";
import FileMetadata from "../models/FileMetadata.js";
import UserCredits from "../models/UserCredits.js";
import { deleteFileFromStorage, resolveLocalPath } from "../config/storage.js";
import jwt from "jsonwebtoken";

// Helper to get uploads directory
const getUploadsDir = () => path.join(process.cwd(), "server", "uploads");

// Resolve the absolute file path from stored metadata, supporting legacy absolute paths
const resolveFilePath = (file) => {
  return resolveLocalPath(file);
};

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
      const storage = (process.env.STORAGE_DRIVER || "local").toLowerCase();
      const doc = {
        fileLocation: file.filename || file.key, // local filename | gridfs filename
        name: file.originalname,
        size: file.size,
        type: file.mimetype,
        clerkId,
        ownerEmail: req.user?.email || req.user?.primary_email || req.user?.primaryEmail,
        storage,
        gridFsBucket: storage === "gridfs" ? (process.env.GRIDFS_BUCKET || "uploads") : undefined,
        gridFsId: storage === "gridfs" ? (file.id?.toString?.() || file.id || file._id?.toString?.()) : undefined,
        isPublic: false,
        uploadedAt: new Date(),
      };
      const fileData = await FileMetadata.create(doc);

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
    // Authorization: allow if public OR token sub matches owner
    let isOwner = false;
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const decoded = jwt.decode(token);
      if (decoded?.sub && decoded.sub === file.clerkId) {
        isOwner = true;
      }
    }
    const authorized = file.isPublic || isOwner;
    if (!authorized) return res.status(403).json({ error: "Not authorized" });

    // GridFS download
    if (file.storage === "gridfs") {
      try {
        const { GridFSBucket, ObjectId } = (await import("mongodb")).default || (await import("mongodb"));
        const db = (await import("mongoose")).default.connection.db;
        const bucket = new GridFSBucket(db, { bucketName: file.gridFsBucket || process.env.GRIDFS_BUCKET || "uploads" });
        const id = file.gridFsId ? new ObjectId(file.gridFsId) : null;
        const readStream = id ? bucket.openDownloadStream(id) : bucket.openDownloadStreamByName(file.fileLocation);
        if (file.type) res.setHeader("Content-Type", file.type);
        res.setHeader("Content-Disposition", `attachment; filename=\"${encodeURIComponent(file.name)}\"`);
        readStream.on("error", () => res.status(404).json({ error: "File not found on server" }));
        return readStream.pipe(res);
      } catch (e) {
        return res.status(500).json({ error: "Error downloading file from GridFS" });
      }
    }
    const filePath = resolveFilePath(file);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found on server" });
    }
    res.download(filePath, file.name);
  } catch (err) {
    res.status(500).json({ error: "Error downloading file" });
  }
};

// Stream a file for inline viewing (images, pdf, audio, video)
export const getFileRaw = async (req, res) => {
  try {
    const file = await FileMetadata.findById(req.params.id);
    if (!file) return res.status(404).json({ error: "File not found" });

    // Only allow if public or owner (optional: if you later add owner view)
    // For now, PublicFileView only links public files.
    if (!file.isPublic) return res.status(403).json({ error: "Not authorized" });
    // Local disk
    if (file.storage === "local" || !file.storage) {
      const filePath = resolveFilePath(file);
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: "File not found on server" });
      }
      if (file.type) res.setHeader("Content-Type", file.type);
      res.setHeader("Content-Disposition", `inline; filename="${encodeURIComponent(file.name)}"`);
      const stream = fs.createReadStream(filePath);
      stream.on("error", () => res.status(500).end());
      return stream.pipe(res);
    }
    if (file.storage === "gridfs") {
      try {
        const { GridFSBucket, ObjectId } = (await import("mongodb")).default || (await import("mongodb"));
        const db = (await import("mongoose")).default.connection.db;
        const bucket = new GridFSBucket(db, { bucketName: file.gridFsBucket || process.env.GRIDFS_BUCKET || "uploads" });
        const id = file.gridFsId ? new ObjectId(file.gridFsId) : null;
        const readStream = id ? bucket.openDownloadStream(id) : bucket.openDownloadStreamByName(file.fileLocation);
        if (file.type) res.setHeader("Content-Type", file.type);
        res.setHeader("Content-Disposition", `inline; filename="${encodeURIComponent(file.name)}"`);
        readStream.on("error", () => res.status(404).json({ error: "File not found on server" }));
        return readStream.pipe(res);
      } catch (e) {
        return res.status(500).json({ error: "Error streaming file from GridFS" });
      }
    }
  // Unknown storage
  return res.status(400).json({ error: "Unsupported storage type" });
  } catch (err) {
    res.status(500).json({ error: "Error streaming file" });
  }
};

// Stream a file for owner (authenticated) even if private
export const getFileRawOwner = async (req, res) => {
  try {
    const file = await FileMetadata.findById(req.params.id);
    if (!file) return res.status(404).json({ error: "File not found" });
    const clerkId = req.user.sub;
    if (file.clerkId !== clerkId) return res.status(403).json({ error: "Not authorized" });

    if (file.storage === "local" || !file.storage) {
      const filePath = resolveFilePath(file);
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: "File not found on server" });
      }
      if (file.type) res.setHeader("Content-Type", file.type);
      res.setHeader("Content-Disposition", `inline; filename="${encodeURIComponent(file.name)}"`);
      const stream = fs.createReadStream(filePath);
      stream.on("error", () => res.status(500).end());
      return stream.pipe(res);
    }
    if (file.storage === "gridfs") {
      try {
        const { GridFSBucket, ObjectId } = (await import("mongodb")).default || (await import("mongodb"));
        const db = (await import("mongoose")).default.connection.db;
        const bucket = new GridFSBucket(db, { bucketName: file.gridFsBucket || process.env.GRIDFS_BUCKET || "uploads" });
        const id = file.gridFsId ? new ObjectId(file.gridFsId) : null;
        const readStream = id ? bucket.openDownloadStream(id) : bucket.openDownloadStreamByName(file.fileLocation);
        if (file.type) res.setHeader("Content-Type", file.type);
        res.setHeader("Content-Disposition", `inline; filename="${encodeURIComponent(file.name)}"`);
        readStream.on("error", () => res.status(404).json({ error: "File not found on server" }));
        return readStream.pipe(res);
      } catch (e) {
        return res.status(500).json({ error: "Error streaming file from GridFS" });
      }
    }
  return res.status(400).json({ error: "Unsupported storage type" });
  } catch (err) {
    res.status(500).json({ error: "Error streaming file" });
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
  await deleteFileFromStorage(file);
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
    // Only owner can toggle visibility
    const clerkId = req.user.sub;
    if (file.clerkId !== clerkId) {
      return res.status(403).json({ error: "Not authorized" });
    }
    file.isPublic = !file.isPublic;
    await file.save();
    res.json(file);
  } catch (err) {
    res.status(500).json({ error: "Error toggling public status" });
  }
};
