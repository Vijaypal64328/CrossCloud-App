import path from "path";
import fs from "fs";
let GridFsStorage; // multer-gridfs-storage class
import mongoose from "mongoose";

const STORAGE_DRIVER = process.env.STORAGE_DRIVER || "local"; // 'local' | 'gridfs'

// Local helpers
const local = {
  getUploadsDir() {
    const dir = path.join(process.cwd(), "server", "uploads");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    return dir;
  },
  createMulterStorage(multer) {
    const uploadDir = this.getUploadsDir();
    return multer.diskStorage({
      destination: (req, file, cb) => cb(null, uploadDir),
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        cb(null, uniqueSuffix + ext);
      },
    });
  },
  resolvePath(file) {
    const stored = file.fileLocation;
    const uploadsDir = this.getUploadsDir();
    // legacy absolute path fallback
    if (stored && path.isAbsolute(stored) && fs.existsSync(stored)) return stored;
    return path.join(uploadsDir, stored);
  },
  delete(file) {
    const abs = this.resolvePath(file);
    if (fs.existsSync(abs)) fs.unlinkSync(abs);
  },
};

export const storageDriver = STORAGE_DRIVER;

export async function createMulterStorage(multer) {
  if (STORAGE_DRIVER === "gridfs") {
    // Lazy import multer-gridfs-storage
    const m = await import("multer-gridfs-storage");
    GridFsStorage = m.GridFsStorage || m.default;
    const url = process.env.MONGO_URI;
    if (!url) throw new Error("Missing MONGO_URI for GridFS storage");
    const storage = new GridFsStorage({
      url,
      file: (req, file) => {
        const ext = path.extname(file.originalname);
        const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
        return {
          filename,
          bucketName: process.env.GRIDFS_BUCKET || "uploads",
          metadata: { originalname: file.originalname, mimetype: file.mimetype },
        };
      },
    });
    return storage;
  }
  return local.createMulterStorage(multer);
}

export function resolveLocalPath(file) {
  return local.resolvePath(file);
}

export async function deleteFileFromStorage(file) {
  if (STORAGE_DRIVER === "gridfs" || file.storage === "gridfs") {
    // Delete from GridFS by id if present
    const db = mongoose.connection.db;
    if (!db) throw new Error("DB not connected");
    const { GridFSBucket, ObjectId } = (await import("mongodb")).default || (await import("mongodb"));
    const bucket = new GridFSBucket(db, { bucketName: file.gridFsBucket || process.env.GRIDFS_BUCKET || "uploads" });
    const id = file.gridFsId ? new ObjectId(file.gridFsId) : null;
    if (id) {
      return new Promise((resolve, reject) => {
        bucket.delete(id, (err) => (err ? reject(err) : resolve()));
      });
    }
    return; // nothing to delete if id missing
  }
  return local.delete(file);
}
