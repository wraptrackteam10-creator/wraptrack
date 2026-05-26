require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const cron = require("node-cron");
const cookieParser = require("cookie-parser");

// ✅ ADD THIS LINE - IMPORT EVENT LISTENERS
require("./controllers/eventListeners");

const { 
  autoUpdateUnclaimedItems,
  autoApplyDailyPenalty, 
  autoArchiveUnclaimedItems 
} = require("./controllers/itemController");

const app = express();
const PORT = process.env.PORT || 8000;

// Connect DB
connectDB();

// Middleware
app.use(express.json());
app.use(cors({
  origin: ["http://localhost:3000", "http://10.0.1.119:3000", "https://wraptrack.vercel.app"], // or your frontend URL
  credentials: true,                                             // 🔥 REQUIRED for cookies
})); 
app.use(cookieParser());

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
const { cleanupExpiredTempSignups } = require("./controllers/authController");

cron.schedule("* * * * *", async () => {
  console.log("⏱️ Running 1-minute maintenance jobs...");

  try {
    await autoUpdateUnclaimedItems();
  } catch (err) {
    console.error("❌ Auto-update Unclaimed failed:", err.message);
  }

  try {
    await autoApplyDailyPenalty(); // 💸 ADD PENALTY HERE
  } catch (err) {
    console.error("❌ Auto penalty failed:", err.message);
  }

  try {
    await cleanupExpiredTempSignups();
  } catch (err) {
    console.error("❌ Cleanup expired temp signups failed:", err.message);
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

/* ----------------------------------------- */

console.log("EMAIL_PASS length:", process.env.EMAIL_PASS?.length);
app.listen(PORT, () => {
  console.log(`🚀 Server running at PORT: ${PORT}`);
});
