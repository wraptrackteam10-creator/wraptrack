const Notification = require("../models/notificationModel");

// ✅ Create a new notification
const createNotification = async (req, res) => {
  try {
    const { userId, guestId, message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const notification = new Notification({
      userId: userId || null,
      guestId: guestId || null,
      message,
      read: false,
    });

    await notification.save();
    res.status(201).json({ message: "Notification created", notification });
  } catch (error) {
    console.error("Create notification error:", error);
    res.status(500).json({ error: "Failed to create notification" });
  }
};

// ✅ Get notifications for a specific user (sorted newest → oldest)
const getNotificationsByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 });
    res.json(notifications);
  } catch (error) {
    console.error("Fetch notifications error:", error);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
};

// ✅ Mark a single notification as read
const markNotificationAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      { read: true },
      { new: true }
    );
    if (!notification)
      return res.status(404).json({ error: "Notification not found" });

    res.json({ message: "Notification marked as read", notification });
  } catch (error) {
    console.error("Mark read error:", error);
    res.status(500).json({ error: "Failed to mark notification as read" });
  }
};

// ✅ Mark all notifications as read for a user
const markAllNotificationsAsRead = async (req, res) => {
  try {
    const { userId } = req.params;
    await Notification.updateMany({ userId, read: false }, { $set: { read: true } });
    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error("Mark all read error:", error);
    res.status(500).json({ error: "Failed to mark all as read" });
  }
};

// ✅ Delete a single notification (simple version)
const deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const deleted = await Notification.findByIdAndDelete(notificationId);

    if (!deleted) {
      return res.status(404).json({ error: "Notification not found" });
    }

    res.json({ message: "Notification deleted successfully" });
  } catch (error) {
    console.error("Delete notification error:", error);
    res.status(500).json({ error: "Failed to delete notification" });
  }
};

// ✅ Delete all notifications for a user
const deleteAllNotifications = async (req, res) => {
  try {
    const { userId } = req.params;
    await Notification.deleteMany({ userId });
    res.json({ message: "All notifications deleted successfully" });
  } catch (error) {
    console.error("Delete all notifications error:", error);
    res.status(500).json({ error: "Failed to delete all notifications" });
  }
};

module.exports = {
  getNotificationsByUser,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  deleteAllNotifications,
  createNotification
};
