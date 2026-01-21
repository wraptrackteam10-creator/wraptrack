const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },

    guestId: { type: String, default: null },

    firstname: { type: String, default: "" },
    lastname: { type: String, default: "" },
    photoUrl: { type: String, default: "" },
    description: { type: String, default: "" },

    action: {
      type: String,
      enum: ["Deposited", "Archive", "Claimed", "Requested Claim"],
      default: "Deposited",
    },

    status: {
      type: String,
      enum: ["Deposited", "Unclaimed", "Claimed", "Pending Verification"],
      default: "Deposited",
    },

    // PENALTY SYSTEM
    penalty: { type: Number, default: 0 },
    lastPenaltyAt: { type: Date, default: null },

    depositedAt: { type: Date, default: Date.now },
    claimedAt: { type: Date, default: null },
    unclaimedAt: { type: Date, default: null },

    // ROLE-BASED ARCHIVE SYSTEM
    archived: {
      admin: {
        isArchived: { type: Boolean, default: false },
        at: { type: Date, default: null },
        by: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
      },
      guard: {
        isArchived: { type: Boolean, default: false },
        at: { type: Date, default: null },
        by: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
      },
      user: {
        isArchived: { type: Boolean, default: false },
        at: { type: Date, default: null },
        by: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Item", itemSchema);
