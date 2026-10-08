import express from "express";
import { getReports } from "../controllers/reportController.js";
import { protect, requireOrgAdmin } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/", protect, requireOrgAdmin, getReports);

export default router;
