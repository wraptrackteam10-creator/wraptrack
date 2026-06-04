const AuditLog = require("../models/auditLogModel");

// Get all audit logs
const getAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find()
      .populate(
        "userId",
        "firstname lastname userCredentials.username userCredentials.type"
      )
      .populate("itemId", "description")
      .sort({ createdAt: -1 });

    res.json(logs);
  } catch (error) {
    console.error("Fetch audit logs error:", error);
    res.status(500).json({
      error: "Failed to fetch audit logs",
    });
  }
};

// Get logs by user
const getAuditLogsByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const logs = await AuditLog.find({ userId })
      .populate("itemId", "description")
      .sort({ createdAt: -1 });

    res.json(logs);
  } catch (error) {
    console.error("Fetch user audit logs error:", error);
    res.status(500).json({
      error: "Failed to fetch user audit logs",
    });
  }
};

// Get logs by item
const getAuditLogsByItem = async (req, res) => {
  try {
    const { itemId } = req.params;

    const logs = await AuditLog.find({ itemId })
      .populate(
        "userId",
        "firstname lastname userCredentials.username"
      )
      .sort({ createdAt: -1 });

    res.json(logs);
  } catch (error) {
    console.error("Fetch item audit logs error:", error);
    res.status(500).json({
      error: "Failed to fetch item audit logs",
    });
  }
};

// Get single audit log
const getAuditLogById = async (req, res) => {
  try {
    const log = await AuditLog.findById(req.params.id)
      .populate(
        "userId",
        "firstname lastname userCredentials.username"
      )
      .populate("itemId", "description");

    if (!log) {
      return res.status(404).json({
        error: "Audit log not found",
      });
    }

    res.json(log);
  } catch (error) {
    console.error("Fetch audit log error:", error);
    res.status(500).json({
      error: "Failed to fetch audit log",
    });
  }
};

module.exports = {
  getAuditLogs,
  getAuditLogsByUser,
  getAuditLogsByItem,
  getAuditLogById,
};