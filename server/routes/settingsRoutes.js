const express = require("express");
const router = express.Router();
const { getSettings, updateSettings } = require("../controllers/settingsController");

router.get("/settings", getSettings);
router.put("/settings", updateSettings);

module.exports = router;
