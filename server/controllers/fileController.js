import {
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import s3Client from "../config/s3.js";
import FileMetadata from "../models/FileMetadata.js";
import UserCredits from "../models/UserCredits.js";

const S3_BUCKET = process.env.AWS_BUCKET_NAME;

// Upload multiple files (metadata saved to DB)
export const uploadFiles = async (req, res) => {
  try {
    const files = req.files;
    const clerkId = req.user.sub;

    if (!files || files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    let userCredits = await UserCredits.findOne({ clerkId });
    if (!userCredits) {
      userCredits = await UserCredits.create({ clerkId, credits: 20, plan: "BASIC" });
    }

    if (userCredits.credits < files.length) {
      return res.status(400).json({ error: "Not enough credits" });
    }

    const savedFiles = [];
    for (let file of files) {
      let fileSize = file.size;

      // If multer-s3 fails to provide a size, get it directly from S3.
      if (!fileSize || fileSize === 0) {
        try {
          const command = new HeadObjectCommand({
            Bucket: S3_BUCKET,
            Key: file.key,
          });
          const { ContentLength } = await s3Client.send(command);
          fileSize = ContentLength;
        } catch (s3Error) {
          console.error(`Could not fetch metadata for file ${file.originalname}:`, s3Error);
          // Default to 0 if metadata fetch fails, but log the error.
          fileSize = 0;
        }
      }

      const fileData = await FileMetadata.create({
        fileLocation: file.key, // Store S3 key
        name: file.originalname,
        size: fileSize, // Use the verified size
        type: file.mimetype,
        clerkId,
        isPublic: false,
        uploadedAt: new Date(),
      });
      savedFiles.push(fileData);
      userCredits.credits -= 1;
    }

    await userCredits.save();
    res.json({ files: savedFiles, remainingCredits: userCredits.credits });
  } catch (err) {
    console.error("S3 upload error:", err);
    res.status(500).json({ error: "Error uploading files" });
  }
};

// Get user's own files
export const getMyFiles = async (req, res) => {
  try {
    const clerkId = req.user.sub;
    const files = await FileMetadata.find({ clerkId }).sort({ uploadedAt: -1 });
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

// Generate a presigned URL for downloading a file
export const downloadFile = async (req, res) => {
  try {
    const file = await FileMetadata.findById(req.params.id);
    if (!file) {
      return res.status(404).json({ error: "File not found" });
    }

    // Add auth check: only owner or if public
    const isPublic = file.isPublic;
    const clerkId = req.user?.sub;
    if (!isPublic && file.clerkId !== clerkId) {
        return res.status(403).json({ error: "Not authorized" });
    }

    const command = new GetObjectCommand({
      Bucket: S3_BUCKET,
      Key: file.fileLocation,
      ResponseContentDisposition: `attachment; filename="${file.name}"`
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // URL expires in 1 hour
    res.json({ downloadUrl: signedUrl });

  } catch (err) {
    console.error("Error generating download URL:", err);
    res.status(500).json({ error: "Error downloading file" });
  }
};

// Generate a presigned URL for inline viewing
export const getFileRaw = async (req, res) => {
  try {
    const file = await FileMetadata.findById(req.params.id);
    if (!file) return res.status(404).json({ error: "File not found" });

    if (!file.isPublic) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const command = new GetObjectCommand({
      Bucket: S3_BUCKET,
      Key: file.fileLocation,
      ResponseContentDisposition: `inline; filename="${file.name}"`,
      ResponseContentType: file.type
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    res.redirect(signedUrl);

  } catch (err) {
    console.error("Error streaming file:", err);
    res.status(500).json({ error: "Error streaming file" });
  }
};

// Delete a file from S3 and DB
export const deleteFile = async (req, res) => {
  try {
    const clerkId = req.user.sub;
    const file = await FileMetadata.findById(req.params.id);

    if (!file || file.clerkId !== clerkId) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const command = new DeleteObjectCommand({
      Bucket: S3_BUCKET,
      Key: file.fileLocation,
    });

    await s3Client.send(command);
    await file.deleteOne();

    res.sendStatus(204);
  } catch (err) {
    console.error("Error deleting file:", err);
    res.status(500).json({ error: "Error deleting file" });
  }
};

// Toggle public/private
export const togglePublic = async (req, res) => {
  try {
    const clerkId = req.user.sub;
    const file = await FileMetadata.findById(req.params.id);
    if (!file || file.clerkId !== clerkId) {
      return res.status(403).json({ error: "Not authorized" });
    }
    file.isPublic = !file.isPublic;
    await file.save();
    res.json(file);
  } catch (err) {
    res.status(500).json({ error: "Error toggling public status" });
  }
};

// Special utility to fix file sizes for records with size 0
export const fixFileSizes = async (req, res) => {
  try {
    const clerkId = req.user.sub;
    // Find all files for the user where size is 0
    const filesToFix = await FileMetadata.find({ clerkId, size: 0 });

    if (filesToFix.length === 0) {
      return res.json({ message: "No files with size 0 found to fix." });
    }

    let updatedCount = 0;
    for (const file of filesToFix) {
      try {
        const command = new HeadObjectCommand({
          Bucket: S3_BUCKET,
          Key: file.fileLocation,
        });
        const { ContentLength } = await s3Client.send(command);

        if (ContentLength > 0) {
          file.size = ContentLength;
          await file.save();
          updatedCount++;
        }
      } catch (s3Error) {
        console.error(`Could not fetch metadata for file ${file.name} (key: ${file.fileLocation}):`, s3Error);
        // Continue to the next file even if one fails
      }
    }

    res.json({
      message: `File size correction process completed.`,
      totalFound: filesToFix.length,
      totalUpdated: updatedCount,
    });

  } catch (err) {
    console.error("Error in fixFileSizes:", err);
    res.status(500).json({ error: "An error occurred while fixing file sizes." });
  }
};
