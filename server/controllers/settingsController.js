import Organization from "../models/Organization.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * Update settings.
 * Organization admins persist org settings.
 * Other authenticated users get acknowledgement only (personal prefs stay client-side for now).
 */
export const updateSettings = asyncHandler(async (req, res) => {
  if (req.auth.isOrgAdmin && req.auth.organizationId) {
    const organization = await Organization.findOne({
      _id: req.auth.organizationId,
    });

    if (!organization) {
      res.status(404);
      throw new Error("Organization not found");
    }

    const { language, currency, theme, notifications, name } = req.body;

    // Name rename only via dedicated rename endpoint or here if admin
    if (name?.trim()) {
      organization.name = name.trim();
    }
    if (language !== undefined) organization.settings.language = language;
    if (currency !== undefined) organization.settings.currency = currency;
    if (theme !== undefined) organization.settings.theme = theme;
    if (notifications !== undefined) {
      organization.settings.notifications = notifications;
    }

    await organization.save();

    return res.json({
      message: "Settings updated successfully",
      organization,
    });
  }

  res.json({
    message: "Settings updated successfully",
  });
});

export const getSettings = asyncHandler(async (req, res) => {
  if (req.auth.organizationId) {
    const organization = await Organization.findById(req.auth.organizationId);
    if (organization) {
      return res.json({
        organizationName: organization.name,
        organizationId: organization._id,
        settings: organization.settings,
        membershipRole: req.auth.membershipRole,
      });
    }
  }

  res.json({
    organizationName: null,
    organizationId: null,
    settings: null,
    membershipRole: null,
    accountType: "individual_artisan",
  });
});
