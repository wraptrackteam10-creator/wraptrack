// models/tempSignupModel.js
const mongoose = require("mongoose");

const tempSignupSchema = new mongoose.Schema({
  firstname: String,
  lastname: String,
  username: String,
  email: String,
  password: String,
  type: {
    type: String,
    enum: ["student", "faculty"]
  },
  institute: String,
  program: String,
  otp: String,
  otpExpiresAt: Date,
}, { timestamps: true });

module.exports = mongoose.model("TempSignup", tempSignupSchema);

