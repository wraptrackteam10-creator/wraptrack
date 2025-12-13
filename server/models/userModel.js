const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    firstname: { type: String, required: true },
    lastname: { type: String, required: true },
    userCredentials: {
      username: { type: String, required: true, unique: true },
      password: { type: String, required: true },
      type: { type: String, enum: ["student", "faculty", "visitor", "guard", "admin"], required: true },
      email: { type: String, required: true, unique: true },
      status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
      otpCode: { type: String },
      otpExpiresAt: { type: Date },
      otpUsed: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
