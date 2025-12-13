const express = require("express");
const { getLogs, getLogsByUser, getLogPhoto } = require("../controllers/logController");
const { getGuardLogs, getGuardLogById, getGuardLogPhoto } = require("../controllers/guardLogController");
const router = express.Router();

// userRoutes
router.get("/logs", getLogs);
router.get("/logs/:userId", getLogsByUser);
router.get("/logs/:id/photo", getLogPhoto);

// guardRoutes
router.get("/guardlogs", getGuardLogs);
router.get("/guardlogs/:guardId", getGuardLogById);
router.get("/guardlogs/:id/photo", getGuardLogPhoto);

module.exports = router;
