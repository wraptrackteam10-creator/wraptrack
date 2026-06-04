const Notification = require("../models/notificationModel");
const ItemLog = require("../models/itemLogModel");
const AuditLog = require("../models/auditLogModel");
const bus = require("../utils/eventBus");

/* ═══════════════════════════════════════════════════════════
   📢 NOTIFICATION LISTENERS
   ═══════════════════════════════════════════════════════════ */

// ✅ Listen to item:created and create notification
bus.on("item:created", async (data) => {
  console.log("📢 item:created event received - listener #" + bus.listenerCount("item:created"));

  try {
    const { item, description } = data;

    if (item.userId) {
      await Notification.create({
        userId: item.userId,
        message: `📦 Item deposited: ${description}`,
      });
    } else if (item.guestId) {
      await Notification.create({
        guestId: item.guestId,
        message: `📦 Item deposited: ${description}`,
      });
    }

    console.log("✅ Notification created for item:created");
  } catch (error) {
    console.error("❌ Failed to create notification on item:created:", error);
  }
});

// ✅ Listen to item:statusChanged and create notification
bus.on("item:statusChanged", async (data) => {
  try {
    const { item, status } = data;

    let message = "";
    if (status === "Unclaimed") {
      message = `⚠️ Your item "${item.description}" has been marked as Unclaimed.`;
    } else if (status === "Claimed") {
      message = `✅ Your item "${item.description}" has been Claimed!`;
    } else if (status === "Pending Verification") {
      message = `🔍 Your item "${item.description}" is pending verification.`;
    }

    if (message) {
      if (item.userId) {
        await Notification.create({
          userId: item.userId,
          message,
        });
      } else if (item.guestId) {
        await Notification.create({
          guestId: item.guestId,
          message,
        });
      }
    }

    console.log("✅ Notification created for item:statusChanged");
  } catch (error) {
    console.error("❌ Failed to create notification on item:statusChanged:", error);
  }
});

// ✅ Listen to item:penaltyApplied and create notification
bus.on("item:penaltyApplied", async (data) => {
  try {
    const { item } = data;

    if (item.userId) {
      await Notification.create({
        userId: item.userId,
        message: `💸 Penalty applied to "${item.description}". Total penalty: ${item.penalty}`,
      });
    } else if (item.guestId) {
      await Notification.create({
        guestId: item.guestId,
        message: `💸 Penalty applied to "${item.description}". Total penalty: ${item.penalty}`,
      });
    }

    console.log("✅ Notification created for item:penaltyApplied");
  } catch (error) {
    console.error("❌ Failed to create notification on item:penaltyApplied:", error);
  }
});

// ✅ Listen to item:archived and create notification
bus.on("item:archived", async (data) => {
  try {
    const { item, role } = data;

    if (role === "user" && item.userId) {
      await Notification.create({
        userId: item.userId,
        message: `📁 Your item "${item.description}" has been archived after 7 days.`,
      });
    } else if (role === "user" && item.guestId) {
      await Notification.create({
        guestId: item.guestId,
        message: `📁 Your item "${item.description}" has been archived after 7 days.`,
      });
    }

    console.log("✅ Notification created for item:archived");
  } catch (error) {
    console.error("❌ Failed to create notification on item:archived:", error);
  }
});

// ✅ Listen to item:unarchived and create notification
bus.on("item:unarchived", async (data) => {
  try {
    const { item, role } = data;

    if (role === "user" && item.userId) {
      await Notification.create({
        userId: item.userId,
        message: `📂 Your item "${item.description}" has been unarchived.`,
      });
    } else if (role === "user" && item.guestId) {
      await Notification.create({
        guestId: item.guestId,
        message: `📂 Your item "${item.description}" has been unarchived.`,
      });
    }

    console.log("✅ Notification created for item:unarchived");
  } catch (error) {
    console.error("❌ Failed to create notification on item:unarchived:", error);
  }
});

// ✅ Listen to item:deleted and create notification
bus.on("item:deleted", async (data) => {
  try {
    const { item } = data;

    if (item.userId) {
      await Notification.create({
        userId: item.userId,
        message: `🗑️ Your item "${item.description}" has been deleted.`,
      });
    } else if (item.guestId) {
      await Notification.create({
        guestId: item.guestId,
        message: `🗑️ Your item "${item.description}" has been deleted.`,
      });
    }

    console.log("✅ Notification created for item:deleted");
  } catch (error) {
    console.error("❌ Failed to create notification on item:deleted:", error);
  }
});

/* ═══════════════════════════════════════════════════════════
   📋 ITEM LOG LISTENERS
   ═══════════════════════════════════════════════════════════ */

// ✅ Listen to item:created and create item log
bus.on("item:created", async (data) => {
  try {
    const { item, description, actor } = data;

    await ItemLog.create({
      itemId: item._id,
      userId: item.userId || null,
      guestId: item.guestId || null,
      action: "Deposited",
      description: `Item deposited: ${description}`,
      actorId: actor?.id || null,
      actorRole: actor?.role || "user",
      metadata: {
        status: item.status,
        penalty: item.penalty,
      },
    });

    // ✅ Audit log for DEPOSIT_ITEM
    await AuditLog.create({
      userId: actor?.id || item.userId || null,
      action: "DEPOSIT_ITEM",
      itemId: item._id,
      details: `Item deposited: "${description}".`,
      metadata: {
        status: item.status,
        depositedAt: item.depositedAt,
      },
    });

    console.log("✅ ItemLog + AuditLog created for item:created");
  } catch (error) {
    console.error("❌ Failed to create item log on item:created:", error);
  }
});

// ✅ Listen to item:statusChanged and create item log
bus.on("item:statusChanged", async (data) => {
  try {
    const { item, status, actor } = data;

    let action = status; // "Deposited", "Unclaimed", "Claimed", "Pending Verification"
    let description = "";

    if (status === "Unclaimed") {
      description = `Item marked as Unclaimed after claiming deadline.`;
      action = "Unclaimed";
    } else if (status === "Claimed") {
      description = `Item successfully claimed by user.`;
      action = "Claimed";
    } else if (status === "Pending Verification") {
      description = `Item claim request pending admin verification.`;
      action = "Pending Verification";
    } else if (status === "Sanctioned") {
      description = `Item has been sanctioned.`;
      action = "Sanctioned";
    }

    await ItemLog.create({
      itemId: item._id,
      userId: item.userId || null,
      guestId: item.guestId || null,
      action,
      description,
      actorId: actor?.id || null,
      actorRole: actor?.role || "system",
      metadata: {
        previousStatus: item.status,
        newStatus: status,
        penalty: item.penalty,
      },
    });

    // ✅ Audit log for item status changes
    let auditAction = null;
    if (status === "Claimed") auditAction = "CLAIM_ITEM";
    else if (status === "Sanctioned") auditAction = "SANCTIONED_ITEM";
    else if (status === "Deposited" || status === "Pending Verification" || status === "Unclaimed") auditAction = "UPDATE_ITEM";

    if (auditAction) {
      await AuditLog.create({
        userId: actor?.id || null,
        action: auditAction,
        itemId: item._id,
        details: description || `Item status changed to "${status}".`,
        metadata: {
          previousStatus: item.status,
          newStatus: status,
        },
      });
    }

    console.log("✅ ItemLog + AuditLog created for item:statusChanged");
  } catch (error) {
    console.error("❌ Failed to create item log on item:statusChanged:", error);
  }
});

// ✅ Listen to item:penaltyApplied and create item log
bus.on("item:penaltyApplied", async (data) => {
  try {
    const { item, actor } = data;

    await ItemLog.create({
      itemId: item._id,
      userId: item.userId || null,
      guestId: item.guestId || null,
      action: "Penalized",
      description: `Penalty applied. Total penalties: ${item.penalty}`,
      actorId: actor?.id || null,
      actorRole: actor?.role || "system",
      metadata: {
        penaltyCount: item.penalty,
        reason: "Unclaimed item penalty",
        penalizedAt: item.lastPenaltyAt,
      },
    });

    console.log("✅ ItemLog created for item:penaltyApplied");
  } catch (error) {
    console.error("❌ Failed to create item log on item:penaltyApplied:", error);
  }
});

// ✅ Listen to item:archived and create item log
bus.on("item:archived", async (data) => {
  try {
    const { item, role, actor } = data;

    await ItemLog.create({
      itemId: item._id,
      userId: item.userId || null,
      guestId: item.guestId || null,
      action: "Archived",
      description: `Item archived by ${role} after 7 days of being unclaimed.`,
      actorId: actor?.id || null,
      actorRole: actor?.role || "system",
      metadata: {
        archivedBy: role,
        archivedAt: new Date(),
        reason: "Auto-archived after 7 days",
      },
    });

    // ✅ Audit log for ARCHIVE_ITEM
    await AuditLog.create({
      userId: actor?.id || null,
      action: "ARCHIVE_ITEM",
      itemId: item._id,
      details: `Item "${item.description}" archived by ${role}.`,
      metadata: {
        archivedBy: role,
        archivedAt: new Date(),
      },
    });

    console.log("✅ ItemLog + AuditLog created for item:archived");
  } catch (error) {
    console.error("❌ Failed to create item log on item:archived:", error);
  }
});

// ✅ Listen to item:unarchived and create item log
bus.on("item:unarchived", async (data) => {
  try {
    const { item, role, actor } = data;

    await ItemLog.create({
      itemId: item._id,
      userId: item.userId || null,
      guestId: item.guestId || null,
      action: "Unarchived",
      description: `Item unarchived by ${role}.`,
      actorId: actor?.id || null,
      actorRole: actor?.role || "user",
      metadata: {
        unarchivedBy: role,
        unarchivedAt: new Date(),
      },
    });

    console.log("✅ ItemLog created for item:unarchived");
  } catch (error) {
    console.error("❌ Failed to create item log on item:unarchived:", error);
  }
});

// ✅ Listen to item:deleted and create item log
bus.on("item:deleted", async (data) => {
  try {
    const { item, actor } = data;

    await ItemLog.create({
      itemId: item._id,
      userId: item.userId || null,
      guestId: item.guestId || null,
      action: "Deleted",
      description: `Item has been deleted.`,
      actorId: actor?.id || null,
      actorRole: actor?.role || "admin",
      metadata: {
        deletedAt: new Date(),
        deletedBy: actor?.id || null,
      },
    });

    console.log("✅ ItemLog created for item:deleted");
  } catch (error) {
    console.error("❌ Failed to create item log on item:deleted:", error);
  }
});

module.exports = { setupEventListeners: () => {} };
