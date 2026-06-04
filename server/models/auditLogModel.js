const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    // User who performed the action
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Optional username snapshot
    username: {
      type: String,
      default: "",
    },

    firstname: {
      type: String,
      default: "",
    },

    lastname: {
      type: String,
      default: "",
    },

    // What action happened
    action: {
      type: String,
      required: true,
      enum: [
        "LOGIN",
        "GUEST_LOGIN",
        "LOGOUT",
        "CREATE_USER",
        "UPDATE_USER",
        "ARCHIVE_USER",
        "UNARCHIVE_USER",
        "DELETE_USER",

        "DEPOSIT_ITEM",
        "CLAIM_ITEM",
        "SANCTIONED_ITEM",
        "UPDATE_ITEM",
        "ARCHIVE_ITEM",

        "UPDATE_SETTINGS",

        "OTHER",
      ],
    },

    // Optional related item
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Item",
      default: null,
    },

    // Additional details
    details: {
      type: String,
      default: "",
    },

    // Login security info
    ipAddress: {
      type: String,
      default: "",
    },

    userAgent: {
      type: String,
      default: "",
    },

    // Optional old/new values
    metadata: {
      type: Object,
      default: {},
    },

    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("AuditLog", auditLogSchema);