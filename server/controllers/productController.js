import Product from "../models/Product.js";
import ProductAssignment from "../models/ProductAssignment.js";
import Membership from "../models/Membership.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/** List products for the authenticated organization */
export const listProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({
    organization: req.auth.organizationId,
  }).sort({ createdAt: -1 });

  res.json(products);
});

/** Create product in authenticated organization — admin only */
export const createProduct = asyncHandler(async (req, res) => {
  const { name, description, price, unit } = req.body;

  if (!name?.trim()) {
    res.status(400);
    throw new Error("Product name is required");
  }

  const product = await Product.create({
    name: name.trim(),
    description: description || "",
    price: price ?? 0,
    unit: unit || "pcs",
    organization: req.auth.organizationId,
    createdBy: req.auth.userId,
  });

  res.status(201).json(product);
});

/** Update product — admin only, same org */
export const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOne({
    _id: req.params.id,
    organization: req.auth.organizationId,
  });

  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  const { name, description, price, unit } = req.body;
  if (name !== undefined) product.name = name.trim();
  if (description !== undefined) product.description = description;
  if (price !== undefined) product.price = price;
  if (unit !== undefined) product.unit = unit;

  await product.save();
  res.json(product);
});

/** Delete product — admin only, same org */
export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOneAndDelete({
    _id: req.params.id,
    organization: req.auth.organizationId,
  });

  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  await ProductAssignment.deleteMany({
    product: product._id,
    organization: req.auth.organizationId,
  });

  res.json({ message: "Product deleted" });
});

/**
 * Assign product to an organization user — admin only.
 * Enforces: product and target user must belong to the same organization.
 * Individual artisans cannot receive org assignments.
 */
export const assignProduct = asyncHandler(async (req, res) => {
  const { productId, userId } = req.body;

  if (!productId || !userId) {
    res.status(400);
    throw new Error("productId and userId are required");
  }

  // Ignore any client-supplied organizationId
  const product = await Product.findOne({
    _id: productId,
    organization: req.auth.organizationId,
  });

  if (!product) {
    res.status(404);
    throw new Error("Product not found in your organization");
  }

  const targetMembership = await Membership.findOne({
    user: userId,
    organization: req.auth.organizationId,
    status: "active",
  });

  if (!targetMembership) {
    res.status(400);
    throw new Error(
      "Target user is not an active member of your organization",
    );
  }

  if (targetMembership.role === "admin" && userId === req.auth.userId.toString()) {
    // Admins may assign to org users; assigning to self is allowed but unusual — permit for org users primarily
  }

  // Block if somehow targeting a user without org membership (individual artisan)
  // Already enforced by membership check above.

  const assignment = await ProductAssignment.findOneAndUpdate(
    {
      product: product._id,
      user: userId,
      organization: req.auth.organizationId,
    },
    {
      product: product._id,
      user: userId,
      organization: req.auth.organizationId,
      assignedBy: req.auth.userId,
    },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
  );

  await assignment.populate("product");
  await assignment.populate("user", "name email");

  res.status(201).json(assignment);
});

/** Unassign product — admin only */
export const unassignProduct = asyncHandler(async (req, res) => {
  const assignment = await ProductAssignment.findOneAndDelete({
    _id: req.params.id,
    organization: req.auth.organizationId,
  });

  if (!assignment) {
    res.status(404);
    throw new Error("Assignment not found");
  }

  res.json({ message: "Assignment removed" });
});

/** List assignments for the organization — admin only */
export const listAssignments = asyncHandler(async (req, res) => {
  const assignments = await ProductAssignment.find({
    organization: req.auth.organizationId,
  })
    .populate("product")
    .populate("user", "name email")
    .sort({ createdAt: -1 });

  res.json(assignments);
});

/**
 * List products assigned to the current user (org user).
 * Individual artisans get an empty list (no org assignments).
 */
export const listMyAssignedProducts = asyncHandler(async (req, res) => {
  if (!req.auth.organizationId) {
    return res.json([]);
  }

  const assignments = await ProductAssignment.find({
    user: req.auth.userId,
    organization: req.auth.organizationId,
  }).populate("product");

  res.json(assignments.map((a) => a.product).filter(Boolean));
});
