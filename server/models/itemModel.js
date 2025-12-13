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

    // Penalty field
    penalty: { type: Number, default: 0 },

    depositedAt: { type: Date, default: Date.now },
    claimedAt: { type: Date, default: null },
    unclaimedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Item", itemSchema);
