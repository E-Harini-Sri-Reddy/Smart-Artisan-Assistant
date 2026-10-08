import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Membership from "../models/Membership.js";
import Organization from "../models/Organization.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * Authenticate JWT and attach authoritative auth context.
 * Never use client-supplied organization/user IDs for authorization.
 *
 * req.auth = {
 *   userId, user, membership, organization,
 *   organizationId, membershipRole, isOrgAdmin, isOrgUser, isIndividualArtisan
 * }
 * req.user = userId (legacy compatibility)
 */
const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    res.status(401);
    throw new Error("No token found");
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    res.status(401);
    throw new Error("Not authorized");
  }

  const user = await User.findById(decoded.id).select("-password");
  if (!user) {
    res.status(401);
    throw new Error("User not found");
  }

  // Prefer a single active membership (first active). Multi-org switching is not supported.
  const membership = await Membership.findOne({
    user: user._id,
    status: "active",
  }).populate("organization");

  const organization = membership?.organization || null;

  const membershipRole = membership?.role || null;
  const isOrgAdmin = Boolean(membership && membershipRole === "admin");
  const isOrgUser = Boolean(membership && membershipRole === "user");
  const isIndividualArtisan = !membership;

  req.auth = {
    userId: user._id,
    user,
    membership,
    organization,
    organizationId: organization?._id || null,
    membershipRole,
    isOrgAdmin,
    isOrgUser,
    isIndividualArtisan,
  };

  // Legacy: many controllers used req.user as the id string/ObjectId
  req.user = user._id;

  next();
});

const requireOrgAdmin = asyncHandler(async (req, res, next) => {
  if (!req.auth?.isOrgAdmin || !req.auth?.organizationId) {
    res.status(403);
    throw new Error("Organization admin access required");
  }
  next();
});

const requireOrgMember = asyncHandler(async (req, res, next) => {
  if (!req.auth?.organizationId || (!req.auth.isOrgAdmin && !req.auth.isOrgUser)) {
    res.status(403);
    throw new Error("Active organization membership required");
  }
  next();
});

/**
 * Artisan-facing tools: individual artisans OR active org users (not required for admins,
 * but admins may also use them if needed).
 */
const requireArtisanAccess = asyncHandler(async (req, res, next) => {
  if (req.auth?.isIndividualArtisan || req.auth?.isOrgUser || req.auth?.isOrgAdmin) {
    return next();
  }
  res.status(403);
  throw new Error("Artisan access required");
});

export { protect, requireOrgAdmin, requireOrgMember, requireArtisanAccess };
