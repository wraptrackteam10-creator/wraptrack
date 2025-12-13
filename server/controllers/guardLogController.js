const GuardLog = require("../models/guardLogModel");

// ✅ Get all guard logs
const getGuardLogs = async (req, res) => {
  try {
    const logs = await GuardLog.find().sort({ createdAt: -1 });
    res.status(200).json(logs);
  } catch (error) {
    res.status(500).json({ message: "Error fetching guard logs", error: error.message });
  }
};

// ✅ Get logs by a specific guard
const getGuardLogById = async (req, res) => {
  try {
    const { guardId } = req.params;
    const logs = await GuardLog.find({ guardId }).sort({ createdAt: -1 });
    if (!logs.length) {
      return res.status(404).json({ message: "No logs found for this guard" });
    }
    res.status(200).json(logs);
  } catch (error) {
    res.status(500).json({ message: "Error fetching guard log", error: error.message });
  }
};

// ✅ Optional: get log photo (if you store images)
const getGuardLogPhoto = async (req, res) => {
  try {
    const log = await GuardLog.findById(req.params.id);
    if (!log || !log.photo || !log.photo.data) {
      return res.status(404).json({ message: "Photo not found" });
    }

    res.set("Content-Type", log.photo.contentType);
    res.send(log.photo.data);
  } catch (error) {
    res.status(500).json({ message: "Error fetching photo", error: error.message });
  }
};

// ✅ (Optional) Create new guard log
const createGuardLog = async (req, res) => {
  try {
    const { guardId, itemId, action, description } = req.body;

    const newLog = new GuardLog({
      guardId,
      itemId,
      action,
      description,
      timestamp: new Date(),
    });

    await newLog.save();
    res.status(201).json({ message: "Guard log created successfully", log: newLog });
  } catch (error) {
    res.status(500).json({ message: "Error creating guard log", error: error.message });
  }
};

module.exports = {
  getGuardLogs,
  getGuardLogById,
  getGuardLogPhoto,
  createGuardLog,
};
