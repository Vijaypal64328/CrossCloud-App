// Example webhook handler (expand as needed)
export const handleWebhook = (req, res) => {
  // You can verify signature and process event here
  res.status(200).json({ message: "Webhook received" });
};
