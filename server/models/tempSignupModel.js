// models/tempSignupModel.js
const mongoose = require("mongoose");

const tempSignupSchema = new mongoose.Schema({
  firstname: { type: String, required: true },
  lastname: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  type: { type: String, enum: ["student", "faculty", "visitor"], default: "student" },
  otp: { type: String, required: true },
  otpExpiresAt: { type: Date, required: true },
}, { timestamps: true });

module.exports = mongoose.model("TempSignup", tempSignupSchema);
