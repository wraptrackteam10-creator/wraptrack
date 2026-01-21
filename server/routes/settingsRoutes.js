const express = require("express");
const router = express.Router();
const { getSettings, updateSettings } = require("../controllers/settingsController");
const authMiddleware = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

// Protect routes — only admin
router.get("/settings", authMiddleware, getSettings);
router.put("/settings", authMiddleware, authorizeRoles("admin"), updateSettings);

module.exports = router;
