// routes/forgotRoutes.js
const express = require("express");
const router = express.Router();
const { requestOtp, resetWithOtp } = require("../controllers/forgotController");

router.post("/request", requestOtp); // POST /api/forgot/request
router.post("/reset", resetWithOtp);  // POST /api/forgot/reset

module.exports = router;
