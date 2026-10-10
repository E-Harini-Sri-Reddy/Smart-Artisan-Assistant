import mongoose from "mongoose";

const productionSchema = new mongoose.Schema(
  {
    productName: { type: String, required: true },
    category: { type: String, required: true },
    quantity: { type: String, required: true },
    unit: { type: String, default: "" },
    materials: { type: String, default: "" },
    cost: { type: Number, required: true, min: 0 },
    date: { type: Date, required: true },
    notes: { type: String, default: "" },
    image: { type: String, default: "" },
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
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      default: null,
      index: true,
    },
    assignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProductAssignment",
      default: null,
      index: true,
    },
    artisan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    source: {
      type: String,
      enum: ["manual", "assignment"],
      default: "manual",
    },
  },
  { timestamps: true },
);

const Production = mongoose.model("Production", productionSchema);
export default Production;
