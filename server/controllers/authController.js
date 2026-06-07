const User = require("../models/userModel");
const TempSignup = require("../models/tempSignupModel");
const AuditLog = require("../models/auditLogModel");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { generateAccessToken, generateRefreshToken } = require("../utils/jwt");

// Safe fetch wrapper (works on Render + Node <18)
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const allowedRoles = ["student", "faculty", "visitor", "guard", "admin"];

// Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verify email via Abstract API
const verifyEmailWithAbstract = async (email) => {
  try {
    const response = await fetch(
      `https://emailreputation.abstractapi.com/v1/?api_key=${process.env.ABSTRACT_API_KEY}&email=${email}`
    );
    const data = await response.json();
    return data.email_deliverability?.status === "deliverable";
  } catch (error) {
    console.error("Abstract API error:", error.message);
    return false;
  }
};

// Step 1: Signup → save in TempSignup with OTP
const signup = async (req, res) => {
  const { firstname, lastname, username, password, email, type, institute, program } = req.body;

  if (!firstname || !lastname || !username || !password || !email || !institute || !program)
    return res.status(400).json({ errorMessage: "All fields are required!" });

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email))
    return res.status(400).json({ errorMessage: "Invalid email format!" });

  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
  if (!passwordRegex.test(password)) {
    return res.status(400).json({
      errorMessage: "Password must contain at least 8 characters, including uppercase, lowercase, numbers, and special characters."
    });
  }

  try {
    const isEmailValid = await verifyEmailWithAbstract(email);
    if (!isEmailValid)
      return res.status(400).json({ errorMessage: "Email is invalid or undeliverable!" });

    if (await User.findOne({ "userCredentials.username": username }))
      return res.status(400).json({ errorMessage: "Username already taken!" });

    if (await User.findOne({ "userCredentials.email": email }))
      return res.status(400).json({ errorMessage: "Email already registered!" });

    let tempUser = await TempSignup.findOne({
      $or: [{ username }, { email }]
    });

    const hashedPassword = await bcrypt.hash(password, 10);
    let otp, otpExpiresAt;

    if (tempUser) {
      if (tempUser.otpExpiresAt > new Date()) {
        otp = tempUser.otp;
        otpExpiresAt = tempUser.otpExpiresAt;

        tempUser.institute = institute;
        tempUser.program = program;
        tempUser.firstname = firstname;
        tempUser.username = username;
        tempUser.lastname = lastname;
        tempUser.password = hashedPassword;
        tempUser.email = email;
        tempUser.type = type?.toLowerCase() || "student";
        await tempUser.save();

        return res.status(200).json({ message: `OTP already sent to ${email}. Please verify.` });
      } else {
        otp = crypto.randomInt(100000, 999999).toString();
        otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

        tempUser.institute = institute;
        tempUser.program = program;
        tempUser.firstname = firstname;
        tempUser.username = username;
        tempUser.lastname = lastname;
        tempUser.password = hashedPassword;
        tempUser.email = email;
        tempUser.type = type?.toLowerCase() || "student";
        tempUser.otp = otp;
        tempUser.otpExpiresAt = otpExpiresAt;
        await tempUser.save();
      }
    } else {
      otp = crypto.randomInt(100000, 999999).toString();
      otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

      tempUser = new TempSignup({
        institute,
        program,
        firstname,
        lastname,
        username,
        email,
        password: hashedPassword,
        type: type?.toLowerCase() || "student",
        otp,
        otpExpiresAt,
      });

      await tempUser.save();
    }

    // Send OTP email (non-blocking)
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: "WraPTrack Account Verification Code",
        html: `
          <p>Hello,</p>
          <p>Thank you for registering with <b>WraPTrack</b>.</p>
          <p>Your OTP is:</p>
          <h2><b>${otp}</b></h2>
          <p>This code expires in 10 minutes.</p>
          <br />
          <p>— WraPTrack Team</p>
        `,
      });
    } catch (mailError) {
      console.error("Email failed:", mailError.message);
    }

    return res.status(200).json({
      message: `OTP sent to ${email}. Please verify to complete signup.`
    });

  } catch (error) {
    console.error("Signup error:", error.message);
    return res.status(500).json({ errorMessage: "Server error. Try again later." });
  }
};

// Step 2: Verify OTP
const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp)
    return res.status(400).json({ errorMessage: "Email and OTP required!" });

  try {
    const tempUser = await TempSignup.findOne({ email });
    if (!tempUser)
      return res.status(400).json({ errorMessage: "OTP not found or expired!" });

    if (tempUser.otpExpiresAt < new Date()) {
      await TempSignup.deleteOne({ email });
      return res.status(400).json({ errorMessage: "OTP expired!" });
    }

    if (tempUser.otp !== otp)
      return res.status(400).json({ errorMessage: "Invalid OTP!" });

    const newUser = new User({
      firstname: tempUser.firstname,
      lastname: tempUser.lastname,
      userCredentials: {
        institute: tempUser.institute,
        program: tempUser.program,
        username: tempUser.username,
        password: tempUser.password,
        type: tempUser.type,
        email: tempUser.email,
        status: "Active",
      },
    });

    await newUser.save();
    await TempSignup.deleteOne({ email });

    return res.status(201).json({ message: "OTP verified! Account created." });
  } catch (error) {
    console.error("Verify OTP error:", error.message);
    return res.status(500).json({ errorMessage: "Server error. Could not verify OTP." });
  }
};

const resendOtp = async (req, res) => {
  const { email } = req.body;
  if (!email)
    return res.status(400).json({ errorMessage: "Email required!" });

  try {
    const tempUser = await TempSignup.findOne({ email });
    if (!tempUser)
      return res.status(400).json({ errorMessage: "No pending signup found for this email!" });

    const newOtp = crypto.randomInt(100000, 999999).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    tempUser.otp = newOtp;
    tempUser.otpExpiresAt = otpExpiresAt;
    await tempUser.save();

    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Your WraPTrack OTP (Resent)",
        html: `
          <p>Your new OTP is:</p>
          <h2><b>${newOtp}</b></h2>
          <p>This code expires in 10 minutes.</p>
        `,
      });
    } catch (mailError) {
      console.error("Resend email failed:", mailError.message);
    }

    return res.status(200).json({ message: "OTP resent successfully." });

  } catch (error) {
    console.error("Resend OTP error:", error.message);
    return res.status(500).json({ errorMessage: "Server error. Could not resend OTP." });
  }
};

const cleanupExpiredTempSignups = async () => {
  try {
    const result = await TempSignup.deleteMany({ otpExpiresAt: { $lt: new Date() } });
    if (result.deletedCount > 0) {
      console.log(`🗑️ Deleted ${result.deletedCount} expired temp signups`);
    }
  } catch (error) {
    console.error("Cleanup error:", error.message);
  }
};

const login = async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ errorMessage: "All fields required" });

  try {
    const user = await User.findOne({ "userCredentials.username": username });
    if (!user)
      return res.status(401).json({ errorMessage: "Invalid username or password" });

    const isMatch = await bcrypt.compare(password, user.userCredentials.password);
    if (!isMatch)
      return res.status(401).json({ errorMessage: "Invalid username or password" });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    const isProduction = process.env.NODE_ENV === "production";
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: isProduction, // Set to true in production with HTTPS
      sameSite: isProduction ? "none" : "lax",
      maxAge: 30 * 60 * 1000, // 15 min
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 30 * 60 * 1000, // 30 min
    });

    // ✅ Audit log for LOGIN
    try {
      await AuditLog.create({
        userId: user._id,
        username: user.userCredentials.username,
        firstname: user.firstname,
        lastname: user.lastname,
        action: "LOGIN",
        details: `User "${user.userCredentials.username}" logged in successfully.`,
        ipAddress: req.ip || req.connection?.remoteAddress || "",
        userAgent: req.headers["user-agent"] || "",
      });
    } catch (auditErr) {
      console.error("Audit log (LOGIN) failed:", auditErr.message);
    }

    return res.status(200).json({
      message: "Login successful",
      user: {
        id: user._id,
        firstname: user.firstname,
        lastname: user.lastname,
        username: user.userCredentials.username,
        email: user.userCredentials.email,
        role: user.userCredentials.type,
      },
    });

  } catch (error) {
    console.error("Login error:", error.message);
    return res.status(500).json({ errorMessage: "Server error, please try again later." });
  }
};

const logout = async (req, res) => {
  const isProduction = process.env.NODE_ENV === "production";
  res.clearCookie("accessToken", {
    httpOnly: true,
    sameSite: isProduction ? "none" : "lax",
    secure: isProduction, // true in HTTPS production
  });
  res.clearCookie("refreshToken", {
    httpOnly: true,
    sameSite: isProduction ? "none" : "lax",
    secure: isProduction,
  });

  // ✅ Audit log for LOGOUT
  try {
    if (req.user) {
      await AuditLog.create({
        userId: req.user.id || req.user._id || null,
        username: req.user.username || "",
        firstname: req.user.firstname || "",
        lastname: req.user.lastname || "",
        action: "LOGOUT",
        details: `User "${req.user.username || req.user.id}" logged out.`,
        ipAddress: req.ip || req.connection?.remoteAddress || "",
        userAgent: req.headers["user-agent"] || "",
      });
    }
  } catch (auditErr) {
    console.error("Audit log (LOGOUT) failed:", auditErr.message);
  }

  return res.status(200).json({ message: "Logged out successfully" });
};

const refresh = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ errorMessage: "No refresh token provided" });
    }

    let payload;
    try {
      payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || (process.env.JWT_SECRET + "_refresh"));
    } catch (err) {
      console.error("Refresh token verification failed:", err.message);
      return res.status(401).json({ errorMessage: "Invalid or expired refresh token" });
    }

    const userId = payload.sub || payload.userId;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({ errorMessage: "User not found" });
    }

    if (user.userCredentials.status !== "Active") {
      return res.status(401).json({ errorMessage: "User is not active" });
    }

    const accessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    const isProduction = process.env.NODE_ENV === "production";
    
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 15 * 60 * 1000, // 15 min
    });

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 30 * 60 * 1000, // 30 min
    });

    return res.status(200).json({
      message: "Token refreshed successfully",
      user: {
        id: user._id,
        firstname: user.firstname,
        lastname: user.lastname,
        username: user.userCredentials.username,
        email: user.userCredentials.email,
        role: user.userCredentials.type,
      },
    });
  } catch (error) {
    console.error("Refresh error:", error.message);
    return res.status(500).json({ errorMessage: "Server error during refresh" });
  }
};

module.exports = { signup, verifyOtp, resendOtp, login, logout, refresh, cleanupExpiredTempSignups };
