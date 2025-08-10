import Profile from "../models/Profile.js";

export const getProfile = async (req, res) => {
  try {
    const clerkId = req.user.sub;
    const profile = await Profile.findOne({ clerkId });
    if (!profile) return res.status(404).json({ error: "Profile not found" });
    res.json(profile);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const clerkId = req.user.sub;
    const { firstName, lastName } = req.body;
    const profile = await Profile.findOneAndUpdate(
      { clerkId },
      { firstName, lastName },
      { new: true }
    );
    if (!profile) return res.status(404).json({ error: "Profile not found" });
    res.json(profile);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
