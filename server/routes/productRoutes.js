import express from "express";
import {
  listProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  assignProduct,
  unassignProduct,
  listAssignments,
  listMyAssignedProducts,
} from "../controllers/productController.js";
import {
  protect,
  requireOrgAdmin,
  requireOrgMember,
  requireArtisanAccess,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/mine", protect, requireArtisanAccess, listMyAssignedProducts);

router.get("/", protect, requireOrgMember, listProducts);
router.post("/", protect, requireOrgAdmin, createProduct);
router.put("/:id", protect, requireOrgAdmin, updateProduct);
router.delete("/:id", protect, requireOrgAdmin, deleteProduct);

router.get("/assignments/list", protect, requireOrgAdmin, listAssignments);
router.post("/assignments", protect, requireOrgAdmin, assignProduct);
router.delete(
  "/assignments/:id",
  protect,
  requireOrgAdmin,
  unassignProduct,
);

export default router;
