const mongoose = require("mongoose");

const itemLogSchema = new mongoose.Schema(
  {
    // =============================
    // REFERENCES
    // =============================
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Item",
      required: true,
      index: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    guestId: {
      type: String,
      default: null,
      index: true,
    },

    itemOwnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // =============================
    // ACTION & ACTOR INFO
    // =============================
    action: {
      type: String,
      enum: [
        "Deposited",
        "Claimed",
        "Unclaimed",
        "Penalized",
        "Archived",
        "Unarchived",
        "Deleted",
        "Verified",
        "Status Changed",
        "Updated",
      ],
      required: true,
      index: true,
    },

    description: {
      type: String,
      required: true,
    },

    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    actorRole: {
      type: String,
      enum: ["user", "guard", "admin", "system"],
      default: "user",
      index: true,
    },

    // =============================
    // METADATA
    // =============================
    metadata: {
      // For status changes
      previousStatus: { type: String, default: null },
      newStatus: { type: String, default: null },

      // For penalties
      penaltyCount: { type: Number, default: 0 },
      previousPenalty: { type: Number, default: 0 },
      penaltyReason: { type: String, default: null },

      // For archives
      archiveRole: {
        type: String,
        enum: ["admin", "guard", "user"],
        default: null,
      },
      archiveReason: { type: String, default: null },

      // For verification
      verifiedBy: { type: String, default: null },
      verificationNotes: { type: String, default: null },

      // Item snapshot at time of action
      itemSnapshot: {
        description: String,
        photoUrl: String,
        status: String,
        penalty: Number,
      },

      // Additional context
      reason: { type: String, default: null },
      notes: { type: String, default: null },
    },

    // =============================
    // TIMESTAMPS
    // =============================
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },

    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// =============================
// INDEXES FOR FAST QUERIES
// =============================
itemLogSchema.index({ itemId: 1, createdAt: -1 });
itemLogSchema.index({ userId: 1, createdAt: -1 });
itemLogSchema.index({ guestId: 1, createdAt: -1 });
itemLogSchema.index({ actorId: 1, createdAt: -1 });
itemLogSchema.index({ action: 1, createdAt: -1 });
itemLogSchema.index({ itemOwnerId: 1, createdAt: -1 });

// =============================
// STATICS FOR EASY CREATION & QUERYING
// =============================

/**
 * Create an ItemLog entry
 * @param {String} itemId - Item ID
 * @param {String} action - Action type
 * @param {Object} data - Log data { userId, actorId, actorRole, description, metadata, etc. }
 */
itemLogSchema.statics.createLog = async function (itemId, action, data = {}) {
  try {
    const logData = {
      itemId,
      action,
      description: data.description || action,
      userId: data.userId || null,
      guestId: data.guestId || null,
      itemOwnerId: data.itemOwnerId || null,
      actorId: data.actorId || null,
      actorRole: data.actorRole || "system",
      metadata: data.metadata || {},
    };

    const log = await this.create(logData);
    return log;
  } catch (error) {
    console.error("❌ Failed to create ItemLog:", error);
    throw error;
  }
};

/**
 * Get complete history for an item
 * @param {String} itemId - Item ID
 * @param {Number} limit - Limit results
 */
itemLogSchema.statics.getItemHistory = async function (itemId, limit = 100) {
  try {
    return await this.find({ itemId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("actorId", "firstname lastname role")
      .populate("userId", "firstname lastname")
      .populate("itemOwnerId", "firstname lastname");
  } catch (error) {
    console.error("❌ Failed to fetch item history:", error);
    throw error;
  }
};

/**
 * Get all item logs for a user
 * @param {String} userId - User ID
 * @param {Number} limit - Limit results
 */
itemLogSchema.statics.getUserItemLogs = async function (userId, limit = 100) {
  try {
    return await this.find({
      $or: [{ userId }, { itemOwnerId: userId }],
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("itemId", "description photoUrl status")
      .populate("actorId", "firstname lastname role");
  } catch (error) {
    console.error("❌ Failed to fetch user item logs:", error);
    throw error;
  }
};

/**
 * Get all item logs for a guest
 * @param {String} guestId - Guest ID
 * @param {Number} limit - Limit results
 */
itemLogSchema.statics.getGuestItemLogs = async function (guestId, limit = 100) {
  try {
    return await this.find({ guestId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("itemId", "description photoUrl status");
  } catch (error) {
    console.error("❌ Failed to fetch guest item logs:", error);
    throw error;
  }
};

/**
 * Get logs by specific action
 * @param {String} action - Action type
 * @param {Number} limit - Limit results
 */
itemLogSchema.statics.getActionLogs = async function (action, limit = 100) {
  try {
    return await this.find({ action })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("itemId", "description status")
      .populate("userId", "firstname lastname")
      .populate("actorId", "firstname lastname role");
  } catch (error) {
    console.error("❌ Failed to fetch action logs:", error);
    throw error;
  }
};

/**
 * Get logs by actor
 * @param {String} actorId - Actor ID
 * @param {Number} limit - Limit results
 */
itemLogSchema.statics.getActorLogs = async function (actorId, limit = 100) {
  try {
    return await this.find({ actorId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("itemId", "description status")
      .populate("userId", "firstname lastname");
  } catch (error) {
    console.error("❌ Failed to fetch actor logs:", error);
    throw error;
  }
};

/**
 * Get logs for a date range
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @param {Number} limit - Limit results
 */
itemLogSchema.statics.getLogsByDateRange = async function (
  startDate,
  endDate,
  limit = 100
) {
  try {
    return await this.find({
      createdAt: { $gte: startDate, $lte: endDate },
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("itemId", "description status")
      .populate("userId", "firstname lastname")
      .populate("actorId", "firstname lastname role");
  } catch (error) {
    console.error("❌ Failed to fetch logs by date range:", error);
    throw error;
  }
};

/**
 * Get penalized items logs
 * @param {Number} limit - Limit results
 */
itemLogSchema.statics.getPenalizedLogs = async function (limit = 100) {
  try {
    return await this.find({ action: "Penalized" })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("itemId", "description penalty")
      .populate("userId", "firstname lastname");
  } catch (error) {
    console.error("❌ Failed to fetch penalized logs:", error);
    throw error;
  }
};

/**
 * Get archived items logs
 * @param {Number} limit - Limit results
 */
itemLogSchema.statics.getArchivedLogs = async function (limit = 100) {
  try {
    return await this.find({ action: "Archived" })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("itemId", "description status")
      .populate("userId", "firstname lastname")
      .populate("actorId", "firstname lastname");
  } catch (error) {
    console.error("❌ Failed to fetch archived logs:", error);
    throw error;
  }
};

/**
 * Count logs by action
 */
itemLogSchema.statics.countByAction = async function () {
  try {
    return await this.aggregate([
      {
        $group: {
          _id: "$action",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);
  } catch (error) {
    console.error("❌ Failed to count logs by action:", error);
    throw error;
  }
};

module.exports = mongoose.model("ItemLog", itemLogSchema);
