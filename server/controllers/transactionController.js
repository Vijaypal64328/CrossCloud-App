import PaymentTransaction from "../models/PaymentTransaction.js";

export const getTransactions = async (req, res) => {
  try {
    const clerkId = req.user.sub;
    const transactions = await PaymentTransaction.find({ clerkId }).sort({ transactionDate: -1 });
    // Map to only include fields expected by frontend
    const mapped = transactions.map(tx => ({
      id: tx._id,
      planId: tx.planId,
      amount: tx.amount,
      creditsAdded: tx.creditsAdded,
      paymentId: tx.paymentId,
      transactionDate: tx.transactionDate || tx.createdAt
    }));
    res.json(mapped);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
