import crypto from "crypto";
import { OAuth2Client } from "google-auth-library";
import User from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { buildAuthResponse } from "../utils/authResponse.js";
import {
  createOrganizationWithAdmin,
  ensureLegacyOrganizationMigrated,
  getActiveMembershipContext,
} from "../services/organizationService.js";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const resolveAuthContext = async (user) => {
  const migrated = await ensureLegacyOrganizationMigrated(user);
  if (migrated.membership) {
    return migrated;
  }
  return getActiveMembershipContext(user._id);
};

// ─── Google OAuth (existing method — preserved) ─────────────────────────────
export const googleAuth = asyncHandler(async (req, res) => {
  const { token, role, organizationName, mode } = req.body;

  if (!token) {
    res.status(400);
    throw new Error("Google token is required");
  }

  const ticket = await client.verifyIdToken({
    idToken: token,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  const { name, email } = ticket.getPayload();

  let user = await User.findOne({ email: email.toLowerCase() }).select(
    "+password",
  );

  if (!user) {
    // Login page should not auto-create accounts
    if (mode === "login") {
      res.status(404);
      throw new Error(
        "We couldn't find an account with this email. Please register before signing in.",
      );
    }

    const requestedRole = role === "organization" ? "organization" : "artisan";

    if (requestedRole === "organization" && !organizationName?.trim()) {
      res.status(400);
      throw new Error("Organization name is required");
    }

    user = await User.create({
      name,
      email: email.toLowerCase(),
      password: crypto.randomBytes(32).toString("hex"),
      role: requestedRole,
      organizationName:
        requestedRole === "organization" ? organizationName.trim() : undefined,
      authProvider: "google",
      emailVerified: true, // Google-verified identity; app email verification still optional later
    });

    if (requestedRole === "organization") {
      const { membership, organization } = await createOrganizationWithAdmin(
        user,
        organizationName,
      );
      return res.status(200).json(buildAuthResponse(user, membership, organization));
    }

    return res.status(200).json(buildAuthResponse(user, null, null));
  }

  // Existing user — do not let client re-assign role/org via Google login
  if (user.authProvider === "local") {
    user.authProvider = "both";
    await user.save();
  }

  const { membership, organization } = await resolveAuthContext(user);
  res.status(200).json(buildAuthResponse(user, membership, organization));
});

// ─── Email/password login ───────────────────────────────────────────────────
export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error("Email and password are required");
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select(
    "+password",
  );

  if (!user) {
    res.status(404);
    throw new Error(
      "We couldn't find an account with this email. Please register before signing in.",
    );
  }

  if (!(await user.matchPassword(password))) {
    res.status(401);
    throw new Error("Incorrect password. Please try again.");
  }

  const { membership, organization } = await resolveAuthContext(user);
  res.json(buildAuthResponse(user, membership, organization));
});

// ─── Email/password registration ────────────────────────────────────────────
export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, organizationName } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Name, email and password are required");
  }

  if (password.length < 8) {
    res.status(400);
    throw new Error("Password must be at least 8 characters");
  }

  const requestedRole = role === "organization" ? "organization" : "artisan";

  if (requestedRole === "organization" && !organizationName?.trim()) {
    res.status(400);
    throw new Error("Organization name is required");
  }

  const userExists = await User.findOne({ email: email.toLowerCase() });
  if (userExists) {
    res.status(400);
    throw new Error("User already exists");
  }

  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password,
    role: requestedRole,
    organizationName:
      requestedRole === "organization" ? organizationName.trim() : undefined,
    authProvider: "local",
    emailVerified: false, // reserved for future verification flow
  });

  if (requestedRole === "organization") {
    const { membership, organization } = await createOrganizationWithAdmin(
      user,
      organizationName,
    );
    return res
      .status(201)
      .json(buildAuthResponse(user, membership, organization));
  }

  // Individual artisan — no organization membership
  res.status(201).json(buildAuthResponse(user, null, null));
});

// ─── Logout (stateless JWT — client clears token) ───────────────────────────
export const logoutUser = asyncHandler(async (req, res) => {
  res.json({ message: "Logged out successfully" });
});

// ─── Forgot password (does not reveal whether email exists) ─────────────────
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const genericMessage =
    "If an account with that email exists, a password reset link has been sent.";

  if (!email) {
    res.status(400);
    throw new Error("Email is required");
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select(
    "+password +passwordResetToken +passwordResetExpires",
  );

  if (!user) {
    return res.json({ message: genericMessage });
  }

  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  const payload = { message: genericMessage };

  // Expose token only outside production so local/dev/test can reset without SMTP
  if (process.env.NODE_ENV !== "production") {
    payload.resetToken = resetToken;
    payload.resetUrl = `/reset-password/${resetToken}`;
  }

  // Structured for future email delivery without rewriting auth
  if (process.env.PASSWORD_RESET_DEBUG === "true") {
    console.log(`[password-reset] token for ${user.email}: ${resetToken}`);
  }

  res.json(payload);
});

// ─── Reset password with token ──────────────────────────────────────────────
export const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!password || password.length < 8) {
    res.status(400);
    throw new Error("Password must be at least 8 characters");
  }

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  }).select("+password +passwordResetToken +passwordResetExpires");

  if (!user) {
    res.status(400);
    throw new Error("Password reset token is invalid or has expired");
  }

  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  if (user.authProvider === "google") {
    user.authProvider = "both";
  }
  await user.save();

  const { membership, organization } = await resolveAuthContext(user);
  res.json(buildAuthResponse(user, membership, organization));
});

// ─── Change password (authenticated) ────────────────────────────────────────
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    res.status(400);
    throw new Error("Current password and new password are required");
  }

  if (newPassword.length < 8) {
    res.status(400);
    throw new Error("New password must be at least 8 characters");
  }

  const user = await User.findById(req.auth.userId).select("+password");
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  // Google-only accounts may not know a password — allow set if authProvider is google
  // and they supply any currentPassword that fails, require they use forgot-password instead
  const hasUsablePassword =
    user.authProvider === "local" || user.authProvider === "both";

  if (hasUsablePassword) {
    const matches = await user.matchPassword(currentPassword);
    if (!matches) {
      res.status(401);
      throw new Error("Current password is incorrect");
    }
  }

  user.password = newPassword;
  if (user.authProvider === "google") {
    user.authProvider = "both";
  }
  await user.save();

  res.json({ message: "Password updated successfully" });
});

// ─── Current session / me ───────────────────────────────────────────────────
export const getMe = asyncHandler(async (req, res) => {
  const { membership, organization } = await resolveAuthContext(req.auth.user);
  res.json(buildAuthResponse(req.auth.user, membership, organization));
});
