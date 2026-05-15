import express from "express";
import {
  getProductions,
  createProduction,
  updateProduction,
  deleteProduction,
  getDashboardSummary,
} from "../controllers/productionController.js";

const router = express.Router();

/**
 * 1. DASHBOARD ROUTE (Specific/Static)
 * Must be first so 'dashboard' isn't caught by the ':id' parameter
 */
router.get("/dashboard/summary", getDashboardSummary);

/**
 * 2. CRUD ROUTES (General)
 */
router.get("/", getProductions);
router.post("/", createProduction);

// Routes with parameters should always come after specific paths
router.put("/:id", updateProduction);
router.delete("/:id", deleteProduction);

export default router;
