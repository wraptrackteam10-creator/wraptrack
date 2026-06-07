const express = require("express");
const { signup, login, logout, verifyOtp, resendOtp, refresh } =  require("../controllers/authController");
const { createGuest } = require("../controllers/guestController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", authMiddleware, logout);
router.post("/verify-otp", verifyOtp);
router.post("/resend-otp", resendOtp);
router.post("/guest", createGuest);
router.post("/refresh", refresh);

module.exports = router;