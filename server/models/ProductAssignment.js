import mongoose from "mongoose";

const productAssignmentSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

productAssignmentSchema.index(
  { product: 1, user: 1, organization: 1 },
  { unique: true },
);

const ProductAssignment =
  mongoose.models.ProductAssignment ||
  mongoose.model("ProductAssignment", productAssignmentSchema);

export default ProductAssignment;
