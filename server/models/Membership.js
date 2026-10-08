import mongoose from "mongoose";

const membershipSchema = new mongoose.Schema(
  {
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
    role: {
      type: String,
      enum: ["admin", "user"],
      required: true,
      default: "user",
    },
    status: {
      type: String,
      enum: ["active", "invited", "suspended", "removed"],
      required: true,
      default: "active",
      index: true,
    },
  },
  { timestamps: true },
);

membershipSchema.index({ user: 1, organization: 1 }, { unique: true });

const Membership =
  mongoose.models.Membership ||
  mongoose.model("Membership", membershipSchema);

export default Membership;
