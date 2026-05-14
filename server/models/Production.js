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
  },
  { timestamps: true },
);

const Production = mongoose.model("Production", productionSchema);
export default Production;
