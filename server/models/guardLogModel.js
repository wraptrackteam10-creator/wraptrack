const mongoose = require("mongoose");

const guardLogSchema = new mongoose.Schema(
  {
    guardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Guard", // or "User" if guards are stored in user collection
      required: true,
    },
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Item",
      required: false,
    },
    action: {
      type: String,
      required: true,
      enum: ["Verified", "Unclaimed", "Removed", "Archived", "Claimed"], // customize as needed
    },
    description: {
      type: String,
      required: true,
    },
    photo: {
      data: Buffer,
      contentType: String,
    },
    // ✅ Add owner info
    owner: {
      firstname: { type: String, required: false },
      lastname: { type: String, required: false },
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("GuardLog", guardLogSchema);
