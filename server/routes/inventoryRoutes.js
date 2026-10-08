import express from "express";
import mongoose from "mongoose";
import Inventory from "../models/Inventory.js";
import { protect, requireArtisanAccess } from "../middlewares/authMiddleware.js";
import { personalResourceFilter } from "../utils/tenantScope.js";

const router = express.Router();

router.use(protect, requireArtisanAccess);

// 1. GET: Fetch owner-scoped items (ignore client artisanId)
router.get("/", async (req, res, next) => {
  try {
    const items = await Inventory.find(personalResourceFilter(req.auth)).sort({
      createdAt: -1,
    });
    return res.json(items);
  } catch (error) {
    next(error);
  }
});

// 2. POST: Insert a brand new record owned by authenticated user
router.post("/", async (req, res, next) => {
  try {
    const { name, itemType, stock, maxStock, unit, price } = req.body;

    const newItem = new Inventory({
      name,
      itemType,
      stock,
      maxStock,
      unit,
      price,
      ownerUser: req.auth.userId,
      artisanId: String(req.auth.userId),
      organization: req.auth.organizationId || null,
    });
    const savedItem = await newItem.save();
    return res.status(201).json(savedItem);
  } catch (error) {
    next(error);
  }
});

// 3. PUT: stock increments/decrements
router.put("/:id/stock", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ message: "Invalid MongoDB Object ID configuration" });
    }

    const updatedItem = await Inventory.findOneAndUpdate(
      { _id: id, ...personalResourceFilter(req.auth) },
      { $inc: { stock: amount } },
      { returnDocument: "after", runValidators: true },
    );

    if (!updatedItem) {
      return res.status(404).json({ message: "Target inventory row not found" });
    }

    if (updatedItem.stock < 0) {
      updatedItem.stock = 0;
      await updatedItem.save();
    }

    return res.json(updatedItem);
  } catch (error) {
    next(error);
  }
});

// 4. PUT: General attribute edits
router.put("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ message: "Invalid MongoDB Object ID configuration" });
    }

    const { name, itemType, stock, maxStock, unit, price } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (itemType !== undefined) updates.itemType = itemType;
    if (stock !== undefined) updates.stock = stock;
    if (maxStock !== undefined) updates.maxStock = maxStock;
    if (unit !== undefined) updates.unit = unit;
    if (price !== undefined) updates.price = price;

    const updatedItem = await Inventory.findOneAndUpdate(
      { _id: id, ...personalResourceFilter(req.auth) },
      { $set: updates },
      { returnDocument: "after", runValidators: true },
    );

    if (!updatedItem) {
      return res.status(404).json({ message: "Target inventory row not found" });
    }

    return res.json(updatedItem);
  } catch (error) {
    next(error);
  }
});

// 5. DELETE
router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ message: "Invalid MongoDB Object ID configuration" });
    }

    const droppedItem = await Inventory.findOneAndDelete({
      _id: id,
      ...personalResourceFilter(req.auth),
    });
    if (!droppedItem) {
      return res.status(404).json({ message: "Target document doesn't exist" });
    }

    return res.json({
      success: true,
      message: "Inventory record wiped successfully",
    });
  } catch (error) {
    next(error);
  }
});

export default router;
