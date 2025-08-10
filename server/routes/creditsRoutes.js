import express from "express";
import { getUserCredits, addCredits } from "../controllers/creditsController.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = express.Router();

router.get("/credits", requireAuth, getUserCredits);
router.post("/add-credits", addCredits); // For webhook/payment — may add auth later

export default router;
