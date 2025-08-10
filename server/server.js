import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";

import fileRoutes from "./routes/fileRoutes.js";
import creditsRoutes from "./routes/creditsRoutes.js";
import webhookRoutes from "./routes/webhookRoutes.js";

dotenv.config();
const app = express();
app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://crosscloud-app-frontend.onrender.com"
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error(err));

// Routes

app.use("/files", fileRoutes);
app.use("/users", creditsRoutes);
app.use("/webhooks", webhookRoutes);

app.listen(process.env.PORT || 5000, () => {
  console.log(`🚀 Server running on port ${process.env.PORT || 5000}`);
});
