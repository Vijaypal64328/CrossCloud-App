import PaymentTransaction from "../models/PaymentTransaction.js";

export const getAllPayments = async (req, res) => {
  try {
    const payments = await PaymentTransaction.find();
    res.json(payments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getUserPayments = async (req, res) => {
  try {
    const clerkId = req.user.sub;
    const payments = await PaymentTransaction.find({ clerkId });
    res.json(payments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
