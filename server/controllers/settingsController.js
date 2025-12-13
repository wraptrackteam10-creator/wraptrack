const Settings = require("../models/settingsModel");

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

    res.json(updated);
  } catch (error) {
    console.error("Update settings error:", error);
    res.status(500).json({ error: "Failed to update settings" });
  }
};

module.exports = { getSettings, updateSettings };
