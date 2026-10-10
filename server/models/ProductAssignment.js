import mongoose from "mongoose";

const attachmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    url: { type: String, required: true },
    mimeType: { type: String, default: "" },
  },
  { _id: false },
);

const priceMessageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["admin", "artisan"],
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    proposedPay: {
      type: Number,
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true },
);

const productAssignmentSchema = new mongoose.Schema(
  {
    assignmentNumber: {
      type: String,
      required: true,
      index: true,
    },
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
    assignmentType: {
      type: String,
      enum: [
        "Installation",
        "Repair",
        "Customization",
        "Inspection",
        "Other",
      ],
      required: true,
      default: "Customization",
    },
    quantity: {
      type: Number,
      default: 1,
      min: 1,
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Urgent"],
      default: "Medium",
    },
    status: {
      type: String,
      enum: [
        "Assigned",
        "Accepted",
        "In Progress",
        "In Transit",
        "Completed",
        "Cancelled",
        "Rejected",
      ],
      default: "Assigned",
      index: true,
    },
    productReceivedAt: {
      type: Date,
      default: null,
    },
    productReceivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    offeredPay: {
      type: Number,
      required: true,
      min: 0,
    },
    priceMessages: {
      type: [priceMessageSchema],
      default: [],
    },
    rejectionReason: {
      type: String,
      default: "",
      trim: true,
    },
    rejectedAt: {
      type: Date,
      default: null,
    },
    dueDate: { type: Date, default: null },
    startDate: { type: Date, default: null },
    estimatedCompletionDate: { type: Date, default: null },
    location: { type: String, default: "", trim: true },
    notes: { type: String, default: "", trim: true },
    requiredMaterials: { type: [String], default: [] },
    requiredSkills: { type: [String], default: [] },
    attachments: { type: [attachmentSchema], default: [] },
    completionNotes: { type: String, default: "" },
    materialsUsed: { type: String, default: "" },
    timeSpent: { type: String, default: "" },
    completionPhotos: { type: [attachmentSchema], default: [] },
    completedAt: { type: Date, default: null },
    acceptedAt: { type: Date, default: null },
    startedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

productAssignmentSchema.index({ organization: 1, assignmentNumber: 1 });

const ProductAssignment =
  mongoose.models.ProductAssignment ||
  mongoose.model("ProductAssignment", productAssignmentSchema);

export default ProductAssignment;
