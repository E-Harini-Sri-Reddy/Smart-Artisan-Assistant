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

userSchema.pre("save", async function () {

  if (!this.isModified("password")) {
    return;
  }

  const salt = await bcrypt.genSalt(10);

  this.password = await bcrypt.hash(
    this.password,
    salt
  );
});

const User = mongoose.model("User", userSchema);

export default User;
