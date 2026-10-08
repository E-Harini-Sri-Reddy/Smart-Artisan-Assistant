import Organization from "../models/Organization.js";
import Membership from "../models/Membership.js";
import User from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createOrganizationWithAdmin } from "../services/organizationService.js";
import { buildAuthResponse } from "../utils/authResponse.js";

/** Get current organization (admin or member) */
export const getOrganization = asyncHandler(async (req, res) => {
  if (!req.auth.organizationId) {
    res.status(404);
    throw new Error("No organization associated with this account");
  }

  const organization = await Organization.findById(req.auth.organizationId);
  if (!organization) {
    res.status(404);
    throw new Error("Organization not found");
  }

  res.json(organization);
});

/**
 * Create organization for an individual artisan (upgrade path).
 * Does not duplicate the user identity.
 */
export const createOrganization = asyncHandler(async (req, res) => {
  const { name } = req.body;

  if (!name?.trim()) {
    res.status(400);
    throw new Error("Organization name is required");
  }

  if (req.auth.organizationId) {
    res.status(400);
    throw new Error("You already belong to an organization");
  }

  const { organization, membership } = await createOrganizationWithAdmin(
    req.auth.user,
    name,
  );

  // Keep legacy fields in sync for older clients
  await User.findByIdAndUpdate(req.auth.userId, {
    role: "organization",
    organizationName: organization.name,
  });
  req.auth.user.role = "organization";
  req.auth.user.organizationName = organization.name;

  res.status(201).json({
    organization,
    auth: buildAuthResponse(req.auth.user, membership, organization),
  });
});

/** Rename organization — admin only */
export const renameOrganization = asyncHandler(async (req, res) => {
  const { name } = req.body;

  if (!name?.trim()) {
    res.status(400);
    throw new Error("Organization name is required");
  }

  const organization = await Organization.findOne({
    _id: req.auth.organizationId,
  });

  if (!organization) {
    res.status(404);
    throw new Error("Organization not found");
  }

  organization.name = name.trim();
  await organization.save();

  // Sync legacy field without re-validating password on the auth user doc
  await User.findByIdAndUpdate(req.auth.userId, {
    organizationName: organization.name,
  });

  res.json(organization);
});

/** Update organization settings — admin only */
export const updateOrganizationSettings = asyncHandler(async (req, res) => {
  const organization = await Organization.findOne({
    _id: req.auth.organizationId,
  });

  if (!organization) {
    res.status(404);
    throw new Error("Organization not found");
  }

  const { language, currency, theme, notifications } = req.body;
  if (language !== undefined) organization.settings.language = language;
  if (currency !== undefined) organization.settings.currency = currency;
  if (theme !== undefined) organization.settings.theme = theme;
  if (notifications !== undefined) {
    organization.settings.notifications = notifications;
  }

  await organization.save();
  res.json(organization);
});

/** List members — admin only */
export const listMembers = asyncHandler(async (req, res) => {
  const members = await Membership.find({
    organization: req.auth.organizationId,
    status: { $ne: "removed" },
  })
    .populate("user", "name email profession phoneNumber")
    .sort({ createdAt: -1 });

  res.json(members);
});

/**
 * Invite / provision an organization user — admin only.
 * Reuses existing user identity if email already exists.
 */
export const inviteMember = asyncHandler(async (req, res) => {
  const { email, name, role = "user", password } = req.body;

  if (!email) {
    res.status(400);
    throw new Error("Email is required");
  }

  if (role === "admin") {
    // Allow adding another admin explicitly, but default is user
  }

  const memberRole = role === "admin" ? "admin" : "user";
  let user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    if (!name || !password) {
      res.status(400);
      throw new Error(
        "Name and temporary password are required to create a new member account",
      );
    }
    if (password.length < 8) {
      res.status(400);
      throw new Error("Password must be at least 8 characters");
    }

    user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: "artisan",
      authProvider: "local",
      emailVerified: false,
    });
  }

  // Prevent assigning individual artisans into wrong orgs via client org id —
  // organization always comes from authenticated admin context.
  let membership = await Membership.findOne({
    user: user._id,
    organization: req.auth.organizationId,
  });

  if (membership) {
    if (membership.status === "removed" || membership.status === "suspended") {
      membership.status = "active";
      membership.role = memberRole;
      await membership.save();
    } else if (membership.status === "active") {
      res.status(400);
      throw new Error("User is already a member of this organization");
    } else {
      membership.status = "active";
      membership.role = memberRole;
      await membership.save();
    }
  } else {
    // Block joining a second org while already active elsewhere (simple model)
    const otherActive = await Membership.findOne({
      user: user._id,
      status: "active",
      organization: { $ne: req.auth.organizationId },
    });
    if (otherActive) {
      res.status(400);
      throw new Error(
        "User already has an active membership in another organization",
      );
    }

    membership = await Membership.create({
      user: user._id,
      organization: req.auth.organizationId,
      role: memberRole,
      status: "active",
    });
  }

  await membership.populate("user", "name email profession phoneNumber");
  res.status(201).json(membership);
});

/** Update member role/status — admin only */
export const updateMember = asyncHandler(async (req, res) => {
  const { role, status } = req.body;

  const membership = await Membership.findOne({
    _id: req.params.id,
    organization: req.auth.organizationId,
  });

  if (!membership) {
    res.status(404);
    throw new Error("Membership not found");
  }

  // Prevent admin from removing their own last admin access carelessly
  if (
    membership.user.toString() === req.auth.userId.toString() &&
    (status === "removed" || status === "suspended" || role === "user")
  ) {
    const otherAdmins = await Membership.countDocuments({
      organization: req.auth.organizationId,
      role: "admin",
      status: "active",
      _id: { $ne: membership._id },
    });
    if (otherAdmins === 0) {
      res.status(400);
      throw new Error("Cannot demote or remove the only active admin");
    }
  }

  if (role === "admin" || role === "user") {
    membership.role = role;
  }
  if (["active", "invited", "suspended", "removed"].includes(status)) {
    membership.status = status;
  }

  await membership.save();
  await membership.populate("user", "name email profession phoneNumber");
  res.json(membership);
});

/** Remove member (soft) — admin only */
export const removeMember = asyncHandler(async (req, res) => {
  const membership = await Membership.findOne({
    _id: req.params.id,
    organization: req.auth.organizationId,
  });

  if (!membership) {
    res.status(404);
    throw new Error("Membership not found");
  }

  if (membership.user.toString() === req.auth.userId.toString()) {
    res.status(400);
    throw new Error("Cannot remove yourself");
  }

  membership.status = "removed";
  await membership.save();
  res.json({ message: "Member removed", membership });
});
