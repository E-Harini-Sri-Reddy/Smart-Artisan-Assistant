import Organization from "../models/Organization.js";
import Membership from "../models/Membership.js";

/**
 * Create a new organization and make the user its admin.
 * Never places the org into a shared/default organization.
 */
export const createOrganizationWithAdmin = async (user, organizationName) => {
  const organization = await Organization.create({
    name: organizationName.trim(),
    createdBy: user._id,
  });

  const membership = await Membership.create({
    user: user._id,
    organization: organization._id,
    role: "admin",
    status: "active",
  });

  return { organization, membership };
};

/**
 * Resolve active membership + organization for a user.
 */
export const getActiveMembershipContext = async (userId) => {
  const membership = await Membership.findOne({
    user: userId,
    status: "active",
  }).populate("organization");

  return {
    membership,
    organization: membership?.organization || null,
  };
};

/**
 * Migrate a legacy organization user (role + organizationName on User)
 * into Organization + Membership if not already migrated.
 */
export const ensureLegacyOrganizationMigrated = async (user) => {
  const existing = await Membership.findOne({
    user: user._id,
    status: "active",
  }).populate("organization");

  if (existing) {
    return {
      membership: existing,
      organization: existing.organization,
    };
  }

  if (user.role === "organization" && user.organizationName) {
    return createOrganizationWithAdmin(user, user.organizationName);
  }

  return { membership: null, organization: null };
};
