const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    // optional userId; guests -> guestName / guestId will be used
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },

    guestId: { type: String, default: null },

    // optional reference to the item this notification is about
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: "Item", required: false, default: null },

    message: { type: String, required: true },
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);