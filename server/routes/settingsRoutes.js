import express from "express";

import { updateSettings } from "../controllers/settingsController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.put("/", protect, updateSettings);

export default router;