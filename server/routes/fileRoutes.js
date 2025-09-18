import express from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import {
  getPresignedUrl,
  registerUploadedFile,
  getPreviewUrl,
  uploadFiles,
  getMyFiles,
  getPublicFile,
  deleteFile,
  togglePublic,
} from "../controllers/fileController.js";

const router = express.Router();

// This route is now deprecated in favor of the presigned URL flow
// router.post("/upload", requireAuth, s3Upload.array("files", 10), uploadFiles);

// New routes for direct-to-S3 upload flow
router.post("/presigned-url", requireAuth, getPresignedUrl);
router.post("/register-file", requireAuth, registerUploadedFile);
router.get("/preview/:id", requireAuth, getPreviewUrl);

router.get("/my", requireAuth, getMyFiles);
router.get("/public/:id", getPublicFile);

router.delete("/:id", requireAuth, deleteFile);
router.patch("/:id/toggle-public", requireAuth, togglePublic);

export default router;
