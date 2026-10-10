import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    price: {
      type: Number,
      default: 0,
      min: 0,
    },
    unit: {
      type: String,
      default: "pcs",
      trim: true,
    },
    unitCategory: {
      type: String,
      enum: ["count", "weight", "liquid", "length"],
      default: "count",
    },
    image: {
      type: String,
      default: "",
      trim: true,
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

productSchema.index({ organization: 1, name: 1 });

const Product =
  mongoose.models.Product || mongoose.model("Product", productSchema);

export default Product;
