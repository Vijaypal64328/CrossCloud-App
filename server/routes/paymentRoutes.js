import express from "express";
import { requireAuth } from "../config/clerkAuth.js";
import { getAllPayments, getUserPayments } from "../controllers/paymentController.js";
import { createOrder, verifyPayment } from "../controllers/razorpayController.js";

const router = express.Router();


router.get("/all", getAllPayments); // Admin
router.get("/my", requireAuth, getUserPayments);

// Razorpay payment routes
router.post("/create-order", requireAuth, createOrder);
router.post("/verify-payment", requireAuth, verifyPayment);

export default router;
