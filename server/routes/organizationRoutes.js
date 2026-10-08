import express from "express";
import {
  getOrganization,
  createOrganization,
  renameOrganization,
  updateOrganizationSettings,
  listMembers,
  inviteMember,
  updateMember,
  removeMember,
} from "../controllers/organizationController.js";
import {
  protect,
  requireOrgAdmin,
  requireOrgMember,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/", protect, createOrganization);
router.get("/me", protect, requireOrgMember, getOrganization);
router.put("/rename", protect, requireOrgAdmin, renameOrganization);
router.put("/settings", protect, requireOrgAdmin, updateOrganizationSettings);

router.get("/members", protect, requireOrgAdmin, listMembers);
router.post("/members", protect, requireOrgAdmin, inviteMember);
router.put("/members/:id", protect, requireOrgAdmin, updateMember);
router.delete("/members/:id", protect, requireOrgAdmin, removeMember);

export default router;
