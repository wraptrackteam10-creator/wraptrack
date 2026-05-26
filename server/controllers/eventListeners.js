const Notification = require("../models/notificationModel");
const bus = require("../utils/eventBus");

// ✅ Listen to item:created and create notification
bus.on("item:created", async (data) => {
  console.log("📢 item:created event received - listener #" + bus.listenerCount("item:created"));  // ← ADD THIS DEBUG LOG
  
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

// ✅ Listen to item:unarchived
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

// ✅ Listen to item:deleted
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

module.exports = { setupEventListeners: () => {} };
