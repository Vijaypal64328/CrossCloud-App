import express from "express";
import { requireAuth } from "../config/clerkAuth.js";
import { getProfile, updateProfile } from "../controllers/profileController.js";

const router = express.Router();

router.get("/me", requireAuth, getProfile);
router.put("/me", requireAuth, updateProfile);

export default router;
