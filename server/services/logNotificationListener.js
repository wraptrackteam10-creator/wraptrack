/**
 * Register listeners for item events and persist Logs/Notifications.
 * Import this file once at app startup (e.g. require('./services/logNotificationListener') in app.js)
 */
const bus = require("../utils/eventBus");
const Log = require("../models/logModel");
const Notification = require("../models/notificationModel");

// Helper to create a log entry (tolerant: doesn't crash main flow)
async function safeCreateLog(data) {
  try {
    await Log.create(data);
  } catch (err) {
    console.error("Failed to create log:", err);
  }
}

// Helper to create notification
async function safeCreateNotification(data) {
  try {
    await Notification.create(data);
  } catch (err) {
    console.error("Failed to create notification:", err);
  }
}

/**
 * Event payloads we expect:
 * - 'item:created': { item, description, actor } where actor may be { id, role, name }
 * - 'item:archived': { item, role, actor }
 * - 'item:unarchived': { item, role, actor }
 * - 'item:statusChanged': { item, status, actor }
 * - 'item:penaltyApplied': { item, actor }
 */
bus.on("item:created", async (payload) => {
  const { item, description, actor = {} } = payload;
  const log = {
    itemId: item._id,
    action: "Deposited",
    status: "Deposited",
    description: description || item.description,
    photoUrl: item.photoUrl,
  };
  if (item.userId) log.userId = item.userId;
  else if (item.guestId) {
    log.guestId = item.guestId;
    log.guestName = item.guestName || `${item.firstname || ""} ${item.lastname || ""}`.trim();
  }

  if (actor.role) log.extra = { actorRole: actor.role, actorId: actor.id };

  await safeCreateLog(log);

  // Notification (prefer userId)
  const notif = {
    message: `You deposited an item: "${description || item.description}".`,
    read: false,
  };
  if (item.userId) notif.userId = item.userId;
  else if (item.guestId) notif.guestId = item.guestId;

  await safeCreateNotification(notif);
});

bus.on("item:archived", async (payload) => {
  const { item, role, actor = {} } = payload;
  const log = {
    itemId: item._id,
    action: "Archived",
    status: item.status,
    description: item.description,
    photoUrl: item.photoUrl,
  };
  if (item.userId) log.userId = item.userId;
  else if (item.guestId) { log.guestId = item.guestId; log.guestName = item.guestName; }
  log.extra = { archivedByRole: role, actorId: actor.id || null };
  await safeCreateLog(log);

  const notif = {
    message: `Your item "${item.description}" was archived by ${role}.`,
    read: false,
  };
  if (item.userId) notif.userId = item.userId;
  else if (item.guestId) { notif.guestId = item.guestId; notif.guestName = item.guestName; }

  await safeCreateNotification(notif);
});

bus.on("item:unarchived", async (payload) => {
  const { item, role, actor = {} } = payload;
  const log = {
    itemId: item._id,
    action: "Unarchived",
    status: item.status,
    description: item.description,
    photoUrl: item.photoUrl,
    extra: { unarchivedByRole: role, actorId: actor.id || null },
  };
  if (item.userId) log.userId = item.userId;
  else if (item.guestId) { log.guestId = item.guestId; log.guestName = item.guestName; }
  await safeCreateLog(log);

  const notif = {
    message: `Your item "${item.description}" was unarchived by ${role}.`,
    read: false,
  };
  if (item.userId) notif.userId = item.userId;
  else if (item.guestId) { notif.guestId = item.guestId; notif.guestName = item.guestName; }
  await safeCreateNotification(notif);
});

bus.on("item:statusChanged", async (payload) => {
  const { item, status, actor = {} } = payload;
  const log = {
    itemId: item._id,
    action: status === "Pending Verification" ? "Requested Claim" : status,
    status,
    description: item.description,
    photoUrl: item.photoUrl,
    extra: { actorId: actor.id || null, actorRole: actor.role || null },
  };
  if (item.userId) log.userId = item.userId;
  else if (item.guestId) { log.guestId = item.guestId; log.guestName = item.guestName; }
  await safeCreateLog(log);

  const notif = {
    message: status === "Claimed" ? `Your item "${item.description}" has been claimed.` : `Status updated to ${status}`,
    read: false,
  };
  if (item.userId) notif.userId = item.userId;
  else if (item.guestId) { notif.guestId = item.guestId; notif.guestName = item.guestName; }
  await safeCreateNotification(notif);
});

// export bus in case other modules prefer to import listeners (not required)
module.exports = bus;