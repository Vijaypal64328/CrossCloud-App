import UserCredits from "../models/UserCredits.js";
import Profile from "../models/Profile.js";

// Helper: Create initial credits
const createInitialCredits = async (clerkId) => {
  const credits = new UserCredits({
    clerkId,
    credits: 20, // Starting credits for new user
    plan: "BASIC"
  });
  return await credits.save();
};

/**
 * GET /users/credits
 */
export const getUserCredits = async (req, res) => {
  try {
    const clerkId = req.user.sub; // Clerk's JWT "sub" claim
    const email = req.user.email || (req.user.email_addresses && req.user.email_addresses[0]?.email_address) || "";
    const firstName = req.user.first_name || req.user.firstName || "";
    const lastName = req.user.last_name || req.user.lastName || "";

    // Auto-create profile if not exists
    let profile = await Profile.findOne({ clerkId });
    if (!profile && email) {
      await Profile.create({
        clerkId,
        email,
        firstName,
        lastName
      });
    }

    let userCredits = await UserCredits.findOne({ clerkId });
    if (!userCredits) {
      // First time — create new credits
      userCredits = await createInitialCredits(clerkId);
    }

    res.json({
      credits: userCredits.credits,
      plan: userCredits.plan
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * POST /users/add-credits
 * (Admin or payment webhook calls this)
 */
export const addCredits = async (req, res) => {
  try {
    const { clerkId, creditsToAdd, plan } = req.body;

    let userCredits = await UserCredits.findOne({ clerkId });
    if (!userCredits) {
      userCredits = await createInitialCredits(clerkId);
    }

    userCredits.credits += creditsToAdd;
    if (plan) userCredits.plan = plan;

    await userCredits.save();

    res.json({
      message: "Credits added successfully",
      credits: userCredits.credits,
      plan: userCredits.plan
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
