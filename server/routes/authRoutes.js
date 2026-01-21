const express = require("express");
const { signup, login, logout, verifyOtp, resendOtp  } =  require("../controllers/authController");
const { createGuest } = require("../controllers/guestController");

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);
router.post("/verify-otp", verifyOtp);
router.post("/resend-otp", resendOtp);
router.post("/guest", createGuest);

module.exports = router;