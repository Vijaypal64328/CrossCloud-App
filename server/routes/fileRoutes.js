import express from "express";
import upload from "../config/multer.js";
import { requireAuth } from "../middleware/requireAuth.js";
import {
  uploadFiles,
  getMyFiles,
  getPublicFile,
  downloadFile,
  deleteFile,
  togglePublic
} from "../controllers/fileController.js";

const router = express.Router();

// Upload (max 10 files at once)
router.post("/upload", requireAuth, upload.array("files", 10), uploadFiles);
router.get("/my", requireAuth, getMyFiles);
router.get("/public/:id", getPublicFile);
router.get("/download/:id", downloadFile);
router.delete("/:id", requireAuth, deleteFile);
router.patch("/:id/toggle-public", requireAuth, togglePublic);

export default router;
