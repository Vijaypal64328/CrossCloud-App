import mongoose from "mongoose";

const paymentTransactionSchema = new mongoose.Schema({
  clerkId: { type: String, required: true },
  orderId: { type: String },
  paymentId: { type: String },
  planId: { type: String },
  amount: { type: Number },
  currency: { type: String },
  status: { type: String, default: "PENDING" },
  transactionDate: { type: Date, default: Date.now },
  creditsAdded: { type: Number },
  userEmail: { type: String },
  userName: { type: String }
});

export default mongoose.model("PaymentTransaction", paymentTransactionSchema);
