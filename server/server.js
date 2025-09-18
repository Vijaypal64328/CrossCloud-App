import "./configEnv.js";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";

import fileRoutes from "./routes/fileRoutes.js";
import creditsRoutes from "./routes/creditsRoutes.js";
import webhookRoutes from "./routes/webhookRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";

const app = express();
const url = `https://crosscloud-app-backend.onrender.com`;

const interval = 300000; // 5 minutes in milliseconds

function keepAlive() {
  axios.get(url)
    .then(() => console.log("Backend pinged to stay awake"))
    .catch((err) => console.error("Ping failed:", err.message));
}

setInterval(keepAlive, interval);

app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.CLIENT_URL || "https://crosscloud-app-frontend.onrender.com"
    : [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
        "http://192.168.41.26:3000"
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

import transactionRoutes from "./routes/transactionRoutes.js";
app.use("/payments", paymentRoutes);
app.use("/transactions", transactionRoutes);

app.listen(process.env.PORT || 5000, () => {
  console.log(`🚀 Server running on port ${process.env.PORT || 5000}`);
});
