require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const cron = require("node-cron");

const { 
  autoUpdateUnclaimedItems, 
  autoArchiveUnclaimedItems 
} = require("./controllers/itemController");

const app = express();
const PORT = process.env.PORT || 8000;

// Connect DB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Routes User
const authRoutes = require("./routes/authRoutes");
app.use("/api", authRoutes);

const itemRoutes = require("./routes/itemRoutes");
app.use("/api", itemRoutes);

const logRoutes = require("./routes/logRoutes");
app.use("/api", logRoutes);

const userRoutes = require("./routes/userRoutes");
app.use("/api", userRoutes);

const forgotRoutes = require('./routes/forgotRoutes');
app.use('/api/forgot', forgotRoutes);


// Routes Guard
const notificationRoutes = require("./routes/notificationRoutes");
app.use("/api", notificationRoutes);

// Admin Routes
const settingsRoutes = require("./routes/settingsRoutes");
app.use("/api", settingsRoutes);

/* -----------------------------------------
   ✅ CRON JOBS  
------------------------------------------ */

// ✅ Auto-update Deposited / Pending Verification → Unclaimed
// Runs every 1 minute
cron.schedule("* * * * *", async () => {
  try {
    console.log("⏱️ Running 1-min auto-update for Unclaimed items...");
    await autoUpdateUnclaimedItems();
  } catch (err) {
    console.error("❌ Cron auto-update failed:", err.message);
  }
}, { timezone: "Asia/Manila" });

// ✅ Auto-archive Unclaimed items older than 7 days
// Runs every day at 11 PM
cron.schedule("0 23 * * *", async () => {
  try {
    console.log("🕚 Running daily Auto-Archive job...");
    await autoArchiveUnclaimedItems();
    console.log("✅ Auto-archive completed successfully.");
  } catch (err) {
    console.error("❌ Auto-archive failed:", err.message);
  }
}, { timezone: "Asia/Manila" });

const { cleanupExpiredTempSignups } = require("./controllers/authController");
// Runs every 1 minute
cron.schedule("* * * * *", async () => {
  await cleanupExpiredTempSignups();
}, { timezone: "Asia/Manila" });

/* ----------------------------------------- */

app.listen(PORT, () => {
  console.log(`🚀 Server running at PORT: ${PORT}`);
});
