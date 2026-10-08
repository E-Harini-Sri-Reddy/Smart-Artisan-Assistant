import express from "express";
import mongoose from "mongoose";
import Order from "../models/Order.js";
import { protect, requireArtisanAccess } from "../middlewares/authMiddleware.js";
import { personalResourceFilter } from "../utils/tenantScope.js";

const router = express.Router();

router.use(protect, requireArtisanAccess);

// 1. GET ALL ORDERS FOR AUTHENTICATED OWNER
router.get("/", async (req, res, next) => {
  try {
    const orders = await Order.find(personalResourceFilter(req.auth)).sort({
      createdAt: -1,
    });
    return res.json(orders);
  } catch (error) {
    next(error);
  }
});

// 2. CREATE NEW ORDER
router.post("/", async (req, res, next) => {
  try {
    const { name, contact, product, pending, delivered } = req.body;

    const newOrder = new Order({
      ownerUser: req.auth.userId,
      artisanId: String(req.auth.userId),
      organization: req.auth.organizationId || null,
      name,
      contact,
      product,
      pending,
      delivered,
    });

    const savedOrder = await newOrder.save();
    return res.status(201).json(savedOrder);
  } catch (error) {
    next(error);
  }
});

// 3. UPDATE AN EXISTING ORDER
router.put("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ message: "Invalid MongoDB Object ID format" });
    }

    const { name, contact, product, pending, delivered } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (contact !== undefined) updates.contact = contact;
    if (product !== undefined) updates.product = product;
    if (pending !== undefined) updates.pending = pending;
    if (delivered !== undefined) updates.delivered = delivered;

    const updatedOrder = await Order.findOneAndUpdate(
      { _id: id, ...personalResourceFilter(req.auth) },
      { $set: updates },
      { returnDocument: "after", runValidators: true },
    );

    if (!updatedOrder) {
      return res.status(404).json({ message: "Target order record not found" });
    }

    return res.json(updatedOrder);
  } catch (error) {
    next(error);
  }
});

export default router;
