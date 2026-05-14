import mongoose from "mongoose";

const paymentSchema = mongoose.Schema(
  {
    customer: {
      type: String,
      required: true,
    },

    product: {
      type: String,
      required: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    status: {
      type: String,
      enum: [
        "Completed",
        "Pending",
        "Failed",
      ],
      required: true,
    },

    paymentDate: {
      type: Date,
      required: true,
    },

    notes: {
      type: String,
      default: "",
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },

  {
    timestamps: true,
  }
);

const Payment = mongoose.model(
  "Payment",
  paymentSchema
);

export default Payment;