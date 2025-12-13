const Log = require("../models/logModel");

// ✅ Get all logs
const getLogs = async (req, res) => {
  try {
    const logs = await Log.find()
      .populate("userId", "firstname lastname type")
      .populate("itemId", "description");
    res.json(logs);
  } catch (error) {
    console.error("Fetch logs error:", error);
    res.status(500).json({ error: "Failed to fetch logs" });
  }
};

// ✅ Get logs by userId
const getLogsByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const logs = await Log.find({ userId })
      .populate("itemId", "description")
      .sort({ createdAt: -1 });
    
    if (!logs.length) {
      return res.status(404).json({ message: "No logs found for this user" });
    }

    res.json(logs);
  } catch (error) {
    console.error("Fetch logs by user error:", error);
    res.status(500).json({ error: "Failed to fetch user logs" });
  }
};

// ✅ Get a specific log's photo
const getLogPhoto = async (req, res) => {
  try {
    const log = await Log.findById(req.params.id);
    if (!log || !log.photo?.data) {
      return res.status(404).json({ error: "Image not found" });
    }
    res.set("Content-Type", log.photo.contentType);
    res.send(log.photo.data);
  } catch (error) {
    console.error("Fetch log photo error:", error);
    res.status(500).json({ error: "Failed to fetch log image" });
  }
};

module.exports = { getLogs, getLogPhoto, getLogsByUser };
