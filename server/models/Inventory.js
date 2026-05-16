import mongoose from "mongoose";

const InventorySchema = new mongoose.Schema(
  {
    artisanId: {
      type: String,
      required: [true, "An artisan owner identifier is required"],
      index: true // Indexed for rapid lookups when loading individual dashboards
    },
    name: {
      type: String,
      required: [true, "Item name is required"],
      trim: true
    },
    itemType: {
      type: String,
      enum: ["product", "material"],
      required: [true, "Item classification type (product/material) is required"]
    },
    stock: {
      type: Number,
      required: true,
      default: 0,
      min: [0, "Stock balance cannot fall below zero"]
    },
    maxStock: {
      type: Number,
      required: true,
      default: 50,
      min: [1, "Maximum capacity must be at least 1"]
    },
    unit: {
      type: String,
      required: true,
      default: "pcs",
      trim: true
    },
    price: {
      type: Number,
      required: function () {
        return this.itemType === "product"; // Price is only mandatory for ready-to-sell goods
      },
      default: 0,
      min: [0, "Selling price cannot be negative"]
    }
  },
  {
    timestamps: true // Automatically tracks createdAt and updatedAt changes
  }
);

// Prevent compilation collisions during nodemon hot-reloads
const Inventory = mongoose.models.Inventory || mongoose.model("Inventory", InventorySchema);

export default Inventory;