const mongoose = require("mongoose");

const logSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: "Item" },
    action: String,
    status: String,
    description: String,
    photoUrl: { type: String }, // ✅ store Cloudinary URL instead of buffer
  },
  { timestamps: true }
);

module.exports = mongoose.model("Log", logSchema);
