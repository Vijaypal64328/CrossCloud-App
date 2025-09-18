import express from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import s3Upload from "../config/s3Upload.js"; // Use S3 upload config
import {
  uploadFiles,
  getMyFiles,
  getPublicFile,
  deleteFile,
  togglePublic,
} from "../controllers/fileController.js";

const router = express.Router();

// Use S3 upload middleware instead of local multer
router.post("/upload", requireAuth, s3Upload.array("files", 10), uploadFiles);
router.get("/my", requireAuth, getMyFiles);
router.get("/public/:id", getPublicFile);

router.delete("/:id", requireAuth, deleteFile);
router.patch("/:id/toggle-public", requireAuth, togglePublic);

export default router;
