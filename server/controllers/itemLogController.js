const ItemLog = require("../models/itemLogModel");

/**
 * Get item history
 * @route GET /api/itemlogs/:itemId
 */
const getItemHistory = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { limit = 100 } = req.query;

    const logs = await ItemLog.getItemHistory(itemId, parseInt(limit));

    res.json({
      success: true,
      itemId,
      logsCount: logs.length,
      logs,
    });
  } catch (error) {
    console.error("❌ Failed to fetch item history:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch item history",
    });
  }
};

/**
 * Get user's item logs
 * @route GET /api/itemlogs/user/:userId
 */
const getUserItemLogs = async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 100 } = req.query;

    const logs = await ItemLog.getUserItemLogs(userId, parseInt(limit));

    res.json({
      success: true,
      userId,
      logsCount: logs.length,
      logs,
    });
  } catch (error) {
    console.error("❌ Failed to fetch user item logs:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch user item logs",
    });
  }
};

/**
 * Get guest's item logs
 * @route GET /api/itemlogs/guest/:guestId
 */
const getGuestItemLogs = async (req, res) => {
  try {
    const { guestId } = req.params;
    const { limit = 100 } = req.query;

    const logs = await ItemLog.getGuestItemLogs(guestId, parseInt(limit));

    res.json({
      success: true,
      guestId,
      logsCount: logs.length,
      logs,
    });
  } catch (error) {
    console.error("❌ Failed to fetch guest item logs:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch guest item logs",
    });
  }
};

/**
 * Get logs by action type
 * @route GET /api/itemlogs/action/:action
 */
const getLogsByAction = async (req, res) => {
  try {
    const { action } = req.params;
    const { limit = 100 } = req.query;

    const logs = await ItemLog.getActionLogs(action, parseInt(limit));

    res.json({
      success: true,
      action,
      logsCount: logs.length,
      logs,
    });
  } catch (error) {
    console.error("❌ Failed to fetch action logs:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch action logs",
    });
  }
};

/**
 * Get logs by actor
 * @route GET /api/itemlogs/actor/:actorId
 */
const getLogsByActor = async (req, res) => {
  try {
    const { actorId } = req.params;
    const { limit = 100 } = req.query;

    const logs = await ItemLog.getActorLogs(actorId, parseInt(limit));

    res.json({
      success: true,
      actorId,
      logsCount: logs.length,
      logs,
    });
  } catch (error) {
    console.error("❌ Failed to fetch actor logs:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch actor logs",
    });
  }
};

/**
 * Get logs by date range
 * @route GET /api/itemlogs/date-range?startDate=2025-01-01&endDate=2025-01-31
 */
const getLogsByDateRange = async (req, res) => {
  try {
    const { startDate, endDate, limit = 100 } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: "startDate and endDate are required",
      });
    }

    const logs = await ItemLog.getLogsByDateRange(
      new Date(startDate),
      new Date(endDate),
      parseInt(limit)
    );

    res.json({
      success: true,
      startDate,
      endDate,
      logsCount: logs.length,
      logs,
    });
  } catch (error) {
    console.error("❌ Failed to fetch logs by date range:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch logs by date range",
    });
  }
};

/**
 * Get penalized items logs
 * @route GET /api/itemlogs/penalized
 */
const getPenalizedLogs = async (req, res) => {
  try {
    const { limit = 100 } = req.query;

    const logs = await ItemLog.getPenalizedLogs(parseInt(limit));

    res.json({
      success: true,
      logsCount: logs.length,
      logs,
    });
  } catch (error) {
    console.error("❌ Failed to fetch penalized logs:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch penalized logs",
    });
  }
};

/**
 * Get archived items logs
 * @route GET /api/itemlogs/archived
 */
const getArchivedLogs = async (req, res) => {
  try {
    const { limit = 100 } = req.query;

    const logs = await ItemLog.getArchivedLogs(parseInt(limit));

    res.json({
      success: true,
      logsCount: logs.length,
      logs,
    });
  } catch (error) {
    console.error("❌ Failed to fetch archived logs:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch archived logs",
    });
  }
};

/**
 * Get logs statistics
 * @route GET /api/itemlogs/stats
 */
const getLogStats = async (req, res) => {
  try {
    const stats = await ItemLog.countByAction();

    const totalLogs = await ItemLog.countDocuments();
    const depositedLogs = await ItemLog.countDocuments({ action: "Deposited" });
    const claimedLogs = await ItemLog.countDocuments({ action: "Claimed" });
    const penalizedLogs = await ItemLog.countDocuments({ action: "Penalized" });
    const archivedLogs = await ItemLog.countDocuments({ action: "Archived" });

    res.json({
      success: true,
      total: totalLogs,
      byAction: stats,
      summary: {
        deposited: depositedLogs,
        claimed: claimedLogs,
        penalized: penalizedLogs,
        archived: archivedLogs,
      },
    });
  } catch (error) {
    console.error("❌ Failed to fetch log stats:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch log stats",
    });
  }
};

/**
 * Get single log
 * @route GET /api/itemlogs/:logId
 */
const getLogById = async (req, res) => {
  try {
    const { logId } = req.params;

    const log = await ItemLog.findById(logId)
      .populate("itemId", "description photoUrl status")
      .populate("userId", "firstname lastname")
      .populate("actorId", "firstname lastname role")
      .populate("itemOwnerId", "firstname lastname");

    if (!log) {
      return res.status(404).json({
        success: false,
        error: "Log not found",
      });
    }

    res.json({
      success: true,
      log,
    });
  } catch (error) {
    console.error("❌ Failed to fetch log:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch log",
    });
  }
};

module.exports = {
  getItemHistory,
  getUserItemLogs,
  getGuestItemLogs,
  getLogsByAction,
  getLogsByActor,
  getLogsByDateRange,
  getPenalizedLogs,
  getArchivedLogs,
  getLogStats,
  getLogById,
};
