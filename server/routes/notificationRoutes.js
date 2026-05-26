const express = require("express");
const {
  getNotificationsByUser,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  deleteAllNotifications,
  createNotification,  // ← ADD THIS
} = require("../controllers/notificationController");

const router = express.Router();

// ✅ Create a new notification
router.post("/notifications", createNotification);  // ← ADD THIS

// ✅ Get all notifications for a user
router.get("/notifications/:userId", getNotificationsByUser);

// ✅ Mark a single notification as read
router.put("/notifications/read/:notificationId", markNotificationAsRead);

// ✅ Mark all notifications as read for a user
router.put("/notifications/read-all/:userId", markAllNotificationsAsRead);

// ✅ Delete a single notification
router.delete("/notifications/:notificationId", deleteNotification);

// ✅ Delete all notifications for a user
router.delete("/notifications/all/:userId", deleteAllNotifications);

module.exports = router;
