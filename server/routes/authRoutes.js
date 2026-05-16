import express from "express";
import {
  registerUser,
  loginUser,
  googleAuth, // Add this import
} from "../controllers/authController.js";

const router = express.Router();

// Manual Registration
router.post("/register", registerUser);

// Manual Login
router.post("/login", loginUser);

// Google Authentication (Signup & Login)
router.post("/google", googleAuth);

export default router;