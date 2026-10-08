import User from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { buildAuthResponse } from "../utils/authResponse.js";
import { getActiveMembershipContext } from "../services/organizationService.js";

/* GET PROFILE */
export const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.auth.userId).select("-password");

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  const { membership, organization } = await getActiveMembershipContext(user._id);
  res.json(buildAuthResponse(user, membership, organization));
});

/* UPDATE PROFILE */
export const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.auth.userId);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  const { name, profession, phoneNumber } = req.body;

  // Never accept role / organizationId / membershipRole from client
  if (name !== undefined) user.name = name;
  if (profession !== undefined) user.profession = profession;
  if (phoneNumber !== undefined) user.phoneNumber = phoneNumber;

  await user.save();

  const { membership, organization } = await getActiveMembershipContext(user._id);
  res.json(buildAuthResponse(user, membership, organization));
});
