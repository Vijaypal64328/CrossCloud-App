import mongoose from "mongoose";

const userCreditsSchema = new mongoose.Schema({
  clerkId: String,
  credits: Number,
  plan: String,
});

export default mongoose.model("UserCredits", userCreditsSchema);
