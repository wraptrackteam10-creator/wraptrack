const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const {
  getAuditLogs,
  getAuditLogsByUser,
  getAuditLogsByItem,
  getAuditLogById,
} = require("../controllers/auditLogController");

const {
  getGuardLogs,
  getGuardLogById,
  getGuardLogPhoto,
} = require("../controllers/guardLogController");

const {
  getItemHistory,
  getUserItemLogs,
  getLogsByAction,
  getPenalizedLogs,
  getArchivedLogs,
  getLogStats,
  getLogById,
} = require("../controllers/itemLogController");

const router = express.Router();

// Apply authMiddleware globally to all log routes
router.use(authMiddleware);

// ========================================
// 📋 Audit Logs (System Activity)
// ========================================

// All audit logs (only admin/guard)
router.get("/auditlogs", authorizeRoles("guard", "admin"), getAuditLogs);

// Audit logs by user (only admin/guard)
router.get("/auditlogs/user/:userId", authorizeRoles("guard", "admin"), getAuditLogsByUser);

// Audit logs by item (only admin/guard)
router.get("/auditlogs/item/:itemId", authorizeRoles("guard", "admin"), getAuditLogsByItem);

// Single audit log (only admin/guard)
router.get("/auditlogs/:id", authorizeRoles("guard", "admin"), getAuditLogById);

// ========================================
// 👔 Guard Logs (Verification Records)
// ========================================

router.get("/guardlogs", authorizeRoles("guard", "admin"), getGuardLogs);

router.get("/guardlogs/:guardId", authorizeRoles("guard", "admin"), getGuardLogById);

router.get("/guardlogs/:id/photo", authorizeRoles("guard", "admin"), getGuardLogPhoto);

// ========================================
// 📦 Item Logs (Item Lifecycle History)
// ========================================

// Specific item log (user, guard, admin)
router.get("/itemlogs/:logId", authorizeRoles("user", "guard", "admin"), getLogById);

// Complete history of an item (user, guard, admin)
router.get("/items/:itemId/history", authorizeRoles("user", "guard", "admin"), getItemHistory);

// All item logs of a user (user, guard, admin)
router.get("/users/:userId/itemlogs", authorizeRoles("user", "guard", "admin"), getUserItemLogs);

// Filter item logs by action (only admin/guard)
router.get("/itemlogs/action/:action", authorizeRoles("guard", "admin"), getLogsByAction);

// Penalized item logs (only admin/guard)
router.get("/itemlogs/penalized", authorizeRoles("guard", "admin"), getPenalizedLogs);

// Archived item logs (only admin/guard)
router.get("/itemlogs/archived", authorizeRoles("guard", "admin"), getArchivedLogs);

// Statistics (only admin/guard)
router.get("/itemlogs/stats", authorizeRoles("guard", "admin"), getLogStats);

module.exports = router;