import express from "express";

import {
  getPayments,
  createPayment,
  updatePayment,
  deletePayment,
} from "../controllers/paymentController.js";

import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

/* GET + CREATE */

router
  .route("/")
  .get(protect, getPayments)
  .post(protect, createPayment);

/* UPDATE + DELETE */

router
  .route("/:id")
  .put(protect, updatePayment)
  .delete(protect, deletePayment);

export default router;