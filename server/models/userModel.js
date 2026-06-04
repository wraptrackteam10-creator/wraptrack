const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    firstname: { type: String, required: true },
    lastname: { type: String, required: true },

    userCredentials: {
      institute: String,
      program: String,

      username: {
        type: String,
        unique: true,
      },

      password: {
        type: String,
      },

      type: {
        type: String,
        enum: ["student", "faculty", "visitor", "guard", "admin"],
        required: true,
      },

      email: {
        type: String,
        unique: true,
      },

      status: {
        type: String,
        enum: ["Active", "Inactive"],
        default: "Active",
      },

      otpCode: String,
      otpExpiresAt: Date,
      otpUsed: {
        type: Boolean,
        default: false,
      },
    },

    lastLoginAt: Date,
    lastLoginIP: String,
    lastUserAgent: String,

    archivedAt: {
      type: Date,
      default: null,
    },

    archivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // ✅ GUEST USER FIELDS
    isGuest: {
      type: Boolean,
      default: false,
    },

    guestCreatedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// ✅ TTL INDEX FOR AUTO-DELETING GUEST ACCOUNTS
// Automatically delete guest accounts after 7 days (604800 seconds)
// This only applies to documents where isGuest is true
userSchema.index(
  { guestCreatedAt: 1 },
  {
    expireAfterSeconds: 604800, // 7 days
    partialFilterExpression: { isGuest: true }, // Only apply to guests
    sparse: true, // Only index documents that have guestCreatedAt
  }
);

module.exports = mongoose.model("User", userSchema);
