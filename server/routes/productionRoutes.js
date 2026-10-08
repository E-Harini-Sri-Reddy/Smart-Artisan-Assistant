import express from "express";
import {
  getProductions,
  createProduction,
  updateProduction,
  deleteProduction,
  getDashboardSummary,
} from "../controllers/productionController.js";
import { protect, requireOrgAdmin } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get(
  "/dashboard/summary",
  protect,
  requireOrgAdmin,
  getDashboardSummary,
);

router.get("/", protect, requireOrgAdmin, getProductions);
router.post("/", protect, requireOrgAdmin, createProduction);
router.put("/:id", protect, requireOrgAdmin, updateProduction);
router.delete("/:id", protect, requireOrgAdmin, deleteProduction);

export default router;
