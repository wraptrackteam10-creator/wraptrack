const Settings = require("../models/settingsModel");
const AuditLog = require("../models/auditLogModel");

// ✅ Get settings (always return the first and only document)
const getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();

    // If first time, create default settings
    if (!settings) {
      settings = await Settings.create({});
    }

    res.json(settings);
  } catch (error) {
    console.error("Get settings error:", error);
    res.status(500).json({ error: "Failed to load settings" });
  }
};

// ✅ Update settings
const updateSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();

    if (!settings) {
      settings = await Settings.create({});
    }

    const updated = await Settings.findByIdAndUpdate(settings._id, req.body, {
      new: true,
    });

    // ✅ Audit log for UPDATE_SETTINGS
    try {
      await AuditLog.create({
        userId: req.user?.id || req.user?._id || null,
        username: req.user?.username || "",
        firstname: req.user?.firstname || "",
        lastname: req.user?.lastname || "",
        action: "UPDATE_SETTINGS",
        details: `System settings were updated.`,
        metadata: {
          updatedFields: Object.keys(req.body),
        },
      });
    } catch (auditErr) {
      console.error("Audit log (UPDATE_SETTINGS) failed:", auditErr.message);
    }

    res.json(updated);
  } catch (error) {
    console.error("Update settings error:", error);
    res.status(500).json({ error: "Failed to update settings" });
  }
};

module.exports = { getSettings, updateSettings };
