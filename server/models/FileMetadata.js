import mongoose from "mongoose";

const fileMetadataSchema = new mongoose.Schema({
  fileLocation: String,
  name: String,
  size: Number,
  type: String,
  clerkId: String,
  isPublic: { type: Boolean, default: false },
  uploadedAt: Date,
});

export default mongoose.model("FileMetadata", fileMetadataSchema);
