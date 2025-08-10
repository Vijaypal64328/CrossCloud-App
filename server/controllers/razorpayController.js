import Razorpay from "razorpay";
import crypto from "crypto";
import PaymentTransaction from "../models/PaymentTransation.js";
import UserCredits from "../models/UserCredits.js";

// Use environment variables for keys (set dummy for now)
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_dummykey",
    key_secret: process.env.RAZORPAY_KEY_SECRET || "dummysecret"
});

export const createOrder = async (req, res) => {
    try {
        const { amount, currency, planId, credits } = req.body;
        if (!amount || !currency) {
            return res.status(400).json({ error: "Amount and currency are required" });
        }
        const options = {
            amount: amount, // in paise
            currency,
            receipt: `rcpt_${Date.now()}`,
            payment_capture: 1
        };
        const order = await razorpay.orders.create(options);
        res.json({ orderId: order.id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId } = req.body;
        const userId = req.user.sub;
        // Verify signature
        const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "dummysecret");
        hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
        const generatedSignature = hmac.digest("hex");
        if (generatedSignature !== razorpay_signature) {
            return res.status(400).json({ success: false, error: "Invalid signature" });
        }
        // Save transaction
        // Determine credits and amount for transaction
        let creditsToAdd = 0;
        let amount = 0;
        if (planId === "premium") {
            creditsToAdd = 500;
            amount = 50000; // in paise
        }
        if (planId === "ultimate") {
            creditsToAdd = 5000;
            amount = 250000; // in paise
        }
        // Save transaction with all required fields
        const payment = new PaymentTransaction({
            clerkId: userId,
            orderId: razorpay_order_id,
            paymentId: razorpay_payment_id,
            planId,
            status: "success",
            creditsAdded: creditsToAdd,
            amount: amount,
            transactionDate: new Date()
        });
        await payment.save();
        // Update user credits
        await UserCredits.findOneAndUpdate(
            { clerkId: userId },
            { $inc: { credits: creditsToAdd } },
            { upsert: true, new: true }
        );
        // Return new credits
        const userCredits = await UserCredits.findOne({ clerkId: userId });
        res.json({ success: true, credits: userCredits.credits });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};
