const mongoose = require("mongoose");

const logSchema = new mongoose.Schema(
  {
    // optional userId (guest logs will use guestId / guestName)
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },

    // guest info
    guestId: { type: String, default: null },

    itemId: { type: mongoose.Schema.Types.ObjectId, ref: "Item", required: true },

    firstname: { type: String, default: "" },
    lastname: { type: String, default: "" },
    description: { type: String, default: "" },
    photoUrl: { type: String, default: "" },

    action: { type: String, default: "" },
    status: { type: String, default: "" },

    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Log", logSchema);