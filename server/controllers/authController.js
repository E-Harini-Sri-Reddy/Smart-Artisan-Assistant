import { OAuth2Client } from "google-auth-library";
import User from "../models/User.js";
import { generateToken } from "../utils/generateToken.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// 1. Google Logic
export const googleAuth = asyncHandler(async (req, res) => {
  const { token, role, organizationName } = req.body;
  const ticket = await client.verifyIdToken({
    idToken: token,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  const { name, email } = ticket.getPayload();

  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({
      name,
      email,
      password: Math.random().toString(36).slice(-10),
      role: role || "artisan",
      organizationName: role === "organization" ? organizationName : undefined,
    });
  }
  res.status(200).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    token: generateToken(user._id),
  });
});

// 2. Manual Login (Required for your routes)
export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (user && (await user.matchPassword(password))) {
    res.json({ _id: user._id, name: user.name, email: user.email, role: user.role, token: generateToken(user._id) });
  } else {
    res.status(401);
    throw new Error("Invalid email or password");
  }
});

// 3. Manual Register (Required for your routes)
export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, organizationName } = req.body;
  const userExists = await User.findOne({ email });
  if (userExists) { res.status(400); throw new Error("User already exists"); }
  const user = await User.create({ name, email, password, role, organizationName });
  res.status(201).json({ _id: user._id, name: user.name, email: user.email, role: user.role, token: generateToken(user._id) });
});