import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
    },

    password: {
      type: String,
      required: true,
    },

    // Distinguish between the two types of users
    role: {
      type: String,
      required: true,
      enum: ["artisan", "organization"],
      default: "artisan",
    },

    // This field is only required if the user is an organization
    organizationName: {
      type: String,
      required: function () {
        return this.role === "organization";
      },
    },

    // Optional: Keep profession if you want artisans to specify their craft (e.g., Pottery, Weaving)
    profession: {
      type: String,
      default: "Artisan",
    },
  },
  {
    timestamps: true,
  },
);

/* MATCH PASSWORD */
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

/* HASH PASSWORD BEFORE SAVE */
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

const User = mongoose.model("User", userSchema);

export default User;