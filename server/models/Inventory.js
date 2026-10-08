import mongoose from "mongoose";

const InventorySchema = new mongoose.Schema(
  {
    ownerUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    // Legacy string kept in sync with ownerUser for existing clients
    artisanId: {
      type: String,
      required: [true, "An artisan owner identifier is required"],
      index: true,
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      default: null,
      index: true,
    },
    name: {
      type: String,
      required: [true, "Item name is required"],
      trim: true,
    },
    itemType: {
      type: String,
      enum: ["product", "material"],
      required: [true, "Item classification type (product/material) is required"],
    },
    stock: {
      type: Number,
      required: true,
      default: 0,
      min: [0, "Stock balance cannot fall below zero"],
    },
    maxStock: {
      type: Number,
      required: true,
      default: 50,
      min: [1, "Maximum capacity must be at least 1"],
    },
    unit: {
      type: String,
      required: true,
      default: "pcs",
      trim: true,
    },
    price: {
      type: Number,
      required: function () {
        return this.itemType === "product";
      },
      default: 0,
      min: [0, "Selling price cannot be negative"],
    },
  },
  {
    timestamps: true,
  },
);

const Inventory =
  mongoose.models.Inventory || mongoose.model("Inventory", InventorySchema);

export default Inventory;
