import mongoose from "mongoose";

const fileMetadataSchema = new mongoose.Schema({
  fileLocation: String,
  name: String,
  size: Number,
  type: String,
  clerkId: String,
  // Optional denormalized owner email for convenience (primary email)
  ownerEmail: String,
  // Storage info: 'local' (default) | 'gridfs'
  storage: { type: String, enum: ["local", "gridfs"], default: "local" },
  // GridFS fields
  gridFsBucket: String,
  gridFsId: String,
  isPublic: { type: Boolean, default: false },
  uploadedAt: Date,
});

export default mongoose.model("FileMetadata", fileMetadataSchema);
