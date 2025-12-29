const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    firstname: { type: String, required: true },
    lastname: { type: String, required: true },
    userCredentials: {
      institute: { type: String },
      program: { type: String },
      username: { type: String, unique: true },
      password: { type: String },
      type: { type: String, enum: ["student", "faculty", "visitor", "guard", "admin"], required: true },
      email: { type: String, unique: true },
      status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
      otpCode: { type: String },
      otpExpiresAt: { type: Date },
      otpUsed: { type: Boolean, default: false },
    },
    archivedAt: { type: Date, default: null },
    archivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
