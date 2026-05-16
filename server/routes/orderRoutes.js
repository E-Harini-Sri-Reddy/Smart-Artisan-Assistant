import express from "express";
import mongoose from "mongoose";

const router = express.Router();

// Define Schema for Order Tracking
const OrderSchema = new mongoose.Schema({
  artisanId: { type: String, required: true }, 
  name: { type: String, required: true },
  contact: { type: String },
  product: { type: String, required: true },
  pending: { type: Number, default: 0 },
  delivered: { type: String, enum: ["Yes", "No"], default: "No" },
  createdAt: { type: Date, default: Date.now }
});

// Prevent compilation collisions during hot dev reloads
const Order = mongoose.models.Order || mongoose.model("Order", OrderSchema);

// 1. GET ALL ORDERS FOR ACTIVE ARTISAN
router.get("/", async (req, res, next) => {
  try {
    const { artisanId } = req.query;
    if (!artisanId) {
      return res.status(400).json({ message: "Missing artisanId query parameter" });
    }
    const orders = await Order.find({ artisanId }).sort({ createdAt: -1 });
    return res.json(orders);
  } catch (error) {
    next(error); // Passes control to your server's errorHandler middleware
  }
});

// 2. CREATE NEW ORDER
router.post("/", async (req, res, next) => {
  try {
    const { artisanId, name, contact, product, pending, delivered } = req.body;
    
    const newOrder = new Order({
      artisanId,
      name,
      contact,
      product,
      pending,
      delivered
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
      return res.status(400).json({ message: "Invalid MongoDB Object ID format" });
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ message: "Target order record not found" });
    }

    return res.json(updatedOrder);
  } catch (error) {
    next(error);
  }
});

export default router; // Clean ES Module export to match server.js imports