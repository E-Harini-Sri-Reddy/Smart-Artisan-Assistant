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
 * CRUD ROUTES
 */
router.get("/", getProductions);
router.post("/", createProduction);
router.put("/:id", updateProduction);
router.delete("/:id", deleteProduction);

/**
 * DASHBOARD ROUTE
 */
router.get("/dashboard/summary", getDashboardSummary);

export default router;
