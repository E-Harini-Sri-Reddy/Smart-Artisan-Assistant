import mongoose from "mongoose";

const assignmentPaymentSchema = new mongoose.Schema(
  {
    assignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProductAssignment",
      required: true,
      index: true,
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    artisan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["advance", "final"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["Pending", "Awaiting Confirmation", "Received"],
      default: "Pending",
      index: true,
    },
    note: {
      type: String,
      default: "",
      trim: true,
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    sentBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    sentAt: {
      type: Date,
      default: null,
    },
    confirmedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

assignmentPaymentSchema.index({ organization: 1, createdAt: -1 });
assignmentPaymentSchema.index({ artisan: 1, createdAt: -1 });

const AssignmentPayment =
  mongoose.models.AssignmentPayment ||
  mongoose.model("AssignmentPayment", assignmentPaymentSchema);

export default AssignmentPayment;
