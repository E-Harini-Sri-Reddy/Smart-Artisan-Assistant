import { generateToken } from "./generateToken.js";

/**
 * Build a consistent auth/session payload for the client.
 * `role` remains "organization" | "artisan" for existing UI routing:
 *   - organization = active org admin
 *   - artisan = individual artisan OR active org user
 */
export const buildAuthResponse = (user, membership = null, organization = null) => {
  const isOrgAdmin =
    membership &&
    membership.status === "active" &&
    membership.role === "admin";

  const isOrgMember =
    membership && membership.status === "active";

  const role = isOrgAdmin ? "organization" : "artisan";
  const accountType = isOrgMember
    ? "organization_member"
    : "individual_artisan";

  return {
    _id: user._id,
    id: user._id,
    name: user.name,
    email: user.email,
    role,
    accountType,
    membershipRole: isOrgMember ? membership.role : null,
    membershipStatus: isOrgMember ? membership.status : null,
    organizationId: isOrgMember
      ? membership.organization?._id || membership.organization || null
      : null,
    organizationName: organization?.name || null,
    profession: user.profession,
    phoneNumber: user.phoneNumber || null,
    authProvider: user.authProvider || "local",
    emailVerified: Boolean(user.emailVerified),
    token: generateToken(user._id),
  };
};
