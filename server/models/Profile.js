import mongoose from "mongoose";

const profileSchema = new mongoose.Schema({
  clerkId: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  firstName: { type: String },
  lastName: { type: String }
});

export default mongoose.model("Profile", profileSchema);
