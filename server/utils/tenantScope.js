/**
 * Tenant / ownership query helpers.
 * Never trust client-supplied organization or user IDs for authorization.
 */

export const orgFilter = (organizationId) => ({
  organization: organizationId,
});

export const ownerFilter = (userId) => ({
  ownerUser: userId,
});

/**
 * Scope for artisan-owned resources (inventory, orders).
 * Individual artisans: own records with no organization.
 * Org users: own records within their organization.
 */
export const personalResourceFilter = (auth) => {
  const filter = { ownerUser: auth.userId };

  if (auth.organizationId) {
    filter.organization = auth.organizationId;
  } else {
    filter.$or = [{ organization: null }, { organization: { $exists: false } }];
  }

  return filter;
};

/**
 * Scope for organization-owned resources (production, org payments, reports).
 */
export const organizationResourceFilter = (auth) => {
  if (!auth.organizationId) {
    const err = new Error("Organization context required");
    err.statusCode = 403;
    throw err;
  }
  return { organization: auth.organizationId };
};
