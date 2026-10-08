import express from "express";
import {
  registerUser,
  loginUser,
  googleAuth,
  logoutUser,
  forgotPassword,
  resetPassword,
  changePassword,
  getMe,
} from "../controllers/authController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/google", googleAuth);
router.post("/logout", protect, logoutUser);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);
router.put("/change-password", protect, changePassword);
router.get("/me", protect, getMe);

export default router;
