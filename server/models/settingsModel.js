const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema(
  {
    adminAccess: { type: Boolean, default: true },
    guardAccess: { type: Boolean, default: true },
    studentAccess: { type: Boolean, default: true },
    loginRestriction: { type: Boolean, default: false },

    // You can add more settings later...
    campusGate: { type: String, default: "Main Campus" },
    operatingHours: { type: String, default: "6:00 AM – 8:00 PM" },
    autoArchiveDays: { type: Number, default: 30 },
    remindersEnable: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Settings", settingsSchema);
