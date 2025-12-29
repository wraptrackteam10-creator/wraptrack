const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    firstname: { type: String },
    lastname: { type: String },
    photoUrl: { type: String },
    description: { type: String },

    action: { 
      type: String,
      enum: ["Deposited", "Archive", "Claimed", "Requested Claim"],
    },

    status: {
      type: String,
      enum: ["Deposited", "Unclaimed", "Claimed", "Pending Verification"],
      default: "Deposited",
    },

    // 🔴 PENALTY SYSTEM
    penalty: { type: Number, default: 0 },

    // 🔑 prevents double penalty in the same day
    lastPenaltyAt: { type: Date, default: null },

    depositedAt: { type: Date, default: Date.now },
    claimedAt: { type: Date, default: null },
    unclaimedAt: { type: Date, default: null },

    archivedAt: { type: Date, default: null },
    archivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Item", itemSchema);
