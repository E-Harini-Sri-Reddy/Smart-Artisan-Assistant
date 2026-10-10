import express from "express";
import {
  listProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  assignProduct,
  updateAssignment,
  unassignProduct,
  listAssignments,
  listMyAssignments,
  listMyAssignedProducts,
  getAssignment,
  acceptAssignment,
  negotiateAssignment,
  replyAssignmentPrice,
  rejectAssignment,
  startAssignment,
  completeAssignment,
  confirmDelivery,
  sendAssignmentPayment,
  requestAdvance,
  approveAdvanceRequest,
  confirmAssignmentPayment,
  listAssignmentPayments,
  listMyAssignmentPayments,
  listAssignmentPaymentsForAssignment,
} from "../controllers/productController.js";
import {
  protect,
  requireOrgAdmin,
  requireOrgMember,
  requireArtisanAccess,
} from "../middlewares/authMiddleware.js";
import upload from "../middlewares/uploadMiddleware.js";

const router = express.Router();

router.get("/mine", protect, requireArtisanAccess, listMyAssignedProducts);

router.get("/", protect, requireOrgMember, listProducts);
router.post(
  "/",
  protect,
  requireOrgAdmin,
  upload.single("image"),
  createProduct,
);
router.put(
  "/:id",
  protect,
  requireOrgAdmin,
  upload.single("image"),
  updateProduct,
);
router.delete("/:id", protect, requireOrgAdmin, deleteProduct);

router.get("/assignments/list", protect, requireOrgAdmin, listAssignments);
router.get("/assignments/mine", protect, requireArtisanAccess, listMyAssignments);
router.get(
  "/assignments/payments/list",
  protect,
  requireOrgAdmin,
  listAssignmentPayments,
);
router.get(
  "/assignments/payments/mine",
  protect,
  requireArtisanAccess,
  listMyAssignmentPayments,
);
router.post(
  "/assignments/payments/:paymentId/approve",
  protect,
  requireOrgAdmin,
  approveAdvanceRequest,
);
router.post(
  "/assignments/payments/:paymentId/confirm",
  protect,
  requireArtisanAccess,
  confirmAssignmentPayment,
);
router.get(
  "/assignments/:id",
  protect,
  requireArtisanAccess,
  getAssignment,
);
router.get(
  "/assignments/:id/payments",
  protect,
  requireOrgMember,
  listAssignmentPaymentsForAssignment,
);
router.post(
  "/assignments/:id/confirm-delivery",
  protect,
  requireOrgAdmin,
  confirmDelivery,
);
router.post(
  "/assignments/:id/payments",
  protect,
  requireOrgAdmin,
  sendAssignmentPayment,
);
router.post(
  "/assignments/:id/request-advance",
  protect,
  requireArtisanAccess,
  requestAdvance,
);
router.post(
  "/assignments",
  protect,
  requireOrgAdmin,
  upload.array("attachments", 10),
  assignProduct,
);
router.put(
  "/assignments/:id",
  protect,
  requireOrgAdmin,
  upload.array("attachments", 10),
  updateAssignment,
);
router.delete(
  "/assignments/:id",
  protect,
  requireOrgAdmin,
  unassignProduct,
);
router.post(
  "/assignments/:id/accept",
  protect,
  requireArtisanAccess,
  acceptAssignment,
);
router.post(
  "/assignments/:id/negotiate",
  protect,
  requireArtisanAccess,
  negotiateAssignment,
);
router.post(
  "/assignments/:id/price-reply",
  protect,
  requireOrgAdmin,
  replyAssignmentPrice,
);
router.post(
  "/assignments/:id/reject",
  protect,
  requireArtisanAccess,
  rejectAssignment,
);
router.post(
  "/assignments/:id/start",
  protect,
  requireArtisanAccess,
  startAssignment,
);
router.post(
  "/assignments/:id/complete",
  protect,
  requireArtisanAccess,
  upload.array("photos", 10),
  completeAssignment,
);

export default router;
