import express from "express";
import crypto from "crypto";
import User from "../models/Profile.js";

const router = express.Router();

// We need raw body for signature verification
router.post("/clerk", express.raw({ type: "application/json" }), async (req, res) => {
  try {
    const signature = req.headers["svix-signature"];
    const payload = req.body;
    const secret = process.env.CLERK_WEBHOOK_SECRET;

    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(JSON.stringify(payload));
    const digest = hmac.digest("hex");

   if (process.env.NODE_ENV !== "production") {
  console.log("🔹 Skipping signature verification in dev mode");
} else {
  if (digest !== signature) {
    return res.status(400).json({ error: "Invalid signature" });
  }
}


    const eventType = payload.type;
    const data = payload.data;

   
    if (eventType === "user.created") {
  await User.create({
    clerkId: data.id,
    email: data.email_addresses[0].email_address,
    firstName: data.first_name,
    lastName: data.last_name,
    profileImageUrl: data.profile_image_url,
    credits: 20 // 🎁 free credits for new users
  });
  console.log(" User created in DB with 20 credits:", data.email_addresses[0].email_address);
}


    if (eventType === "user.updated") {
      await User.findOneAndUpdate(
        { clerkId: data.id },
        {
          firstName: data.first_name,
          lastName: data.last_name,
          profileImageUrl: data.profile_image_url
        }
      );
      console.log("♻️ User updated in DB:", data.email_addresses[0].email_address);
    }

    if (eventType === "user.deleted") {
      await User.findOneAndDelete({ clerkId: data.id });
      console.log("🗑 User deleted from DB:", data.id);
    }

    res.status(200).send("ok");
  } catch (err) {
    console.error("Webhook error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
