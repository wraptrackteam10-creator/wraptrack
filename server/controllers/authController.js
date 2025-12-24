const User = require("../models/userModel");
const TempSignup = require("../models/tempSignupModel");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
// do not add this const fetch = require("node-fetch"); // make sure fetch is available
const jwt = require("jsonwebtoken");
const { generateAccessToken } = require("../utils/jwt");

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
  if (!emailRegex.test(email)) return res.status(400).json({ errorMessage: "Invalid email format!" });

  try {
    const isEmailValid = await verifyEmailWithAbstract(email);
    if (!isEmailValid) return res.status(400).json({ errorMessage: "Email is invalid or undeliverable!" });

    // Check existing users
    if (await User.findOne({ "userCredentials.username": username })) return res.status(400).json({ errorMessage: "Username already taken!" });
    if (await User.findOne({ "userCredentials.email": email })) return res.status(400).json({ errorMessage: "Email already registered!" });

    // Check TempSignup for existing pending OTP
    let tempUser = await TempSignup.findOne({
      $or: [{ username }, { email }]
    });

    const hashedPassword = await bcrypt.hash(password, 10);
    let otp, otpExpiresAt;

    if (tempUser) {
      // If OTP is still valid, reuse it
      if (tempUser.otpExpiresAt > new Date()) {
        otp = tempUser.otp;
        otpExpiresAt = tempUser.otpExpiresAt;

        // Update tempUser with any changed fields
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
        // OTP expired → generate new OTP
        otp = crypto.randomInt(100000, 999999).toString();
        otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

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
      // Create new temp signup
      otp = crypto.randomInt(100000, 999999).toString();
      otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

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

    // Send OTP email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "WraPTrack Account Verification Code",
      html: `
        <p>Hello,</p>

        <p>Thank you for registering with <b>WraPTrack</b>.</p>

        <p>Your One-Time Password (OTP) for account verification is:</p>

        <h2 style="letter-spacing: 2px;"><b>${otp}</b></h2>

        <p>This code will expire in <b>10 minutes</b>.</p>

        <p style="color: #666;">
          Please do not share this code with anyone for security reasons.
        </p>

        <p>
          If you did not request this verification, please ignore this email.
        </p>

        <br />
        <p>— WraPTrack Team</p>
      `,
    });


    res.status(200).json({ message: `OTP sent to ${email}. Please verify to complete signup.` });

  } catch (error) {
    console.error("Signup error:", error.message);
    res.status(500).json({ errorMessage: "Server error. Try again later." });
  }
};

// Step 2: Verify OTP → move data from TempSignup to Users
const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ errorMessage: "Email and OTP required!" });

  try {
    const tempUser = await TempSignup.findOne({ email });
    if (!tempUser) return res.status(400).json({ errorMessage: "OTP not found or expired!" });
    if (tempUser.otpExpiresAt < new Date()) {
      await TempSignup.deleteOne({ email });
      return res.status(400).json({ errorMessage: "OTP expired!" });
    }
    if (tempUser.otp !== otp) return res.status(400).json({ errorMessage: "Invalid OTP!" });

    const newUser = new User({
      firstname: tempUser.firstname,
      lastname: tempUser.lastname,
      userCredentials: {
        institute: tempUser.institute,   // ✅ ADD THIS
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

    res.status(201).json({ message: "OTP verified! Account created." });
  } catch (error) {
    console.error("Verify OTP error:", error.message);
    res.status(500).json({ errorMessage: "Server error. Could not verify OTP." });
  }
};

const resendOtp = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ errorMessage: "Email required!" });

  try {
    const tempUser = await TempSignup.findOne({ email });
    if (!tempUser) return res.status(400).json({ errorMessage: "No pending signup found for this email!" });

    // Generate new OTP
    const newOtp = crypto.randomInt(100000, 999999).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    tempUser.otp = newOtp;
    tempUser.otpExpiresAt = otpExpiresAt;
    await tempUser.save();

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your WraPTrack OTP (Resent)",
      html: `Your new OTP is <h2><b>${newOtp}</b></h2>. It will expire in 10 minutes.`,
    });

    res.status(200).json({ message: "OTP resent successfully." });
  } catch (error) {
    console.error("Resend OTP error:", error.message);
    res.status(500).json({ errorMessage: "Server error. Could not resend OTP." });
  }
};

// Delete expired temp signups
const cleanupExpiredTempSignups = async () => {
  try {
    const result = await TempSignup.deleteMany({ otpExpiresAt: { $lt: new Date() } });
    if (result.deletedCount > 0) {
      console.log(`🗑️ Deleted ${result.deletedCount} expired temp signups`);
    }
  } catch (error) {
    console.error("❌ Cleanup expired temp signups error:", error.message);
  }
};

// Login remains the same
// const login = async (req, res) => {
//   const { username, password } = req.body;
//   if (!username || !password) return res.status(400).json({ errorMessage: "All fields required" });

//   try {
//     const user = await User.findOne({ "userCredentials.username": username });
//     if (!user) return res.status(401).json({ errorMessage: "Invalid username or password" });

//     const isMatch = await bcrypt.compare(password, user.userCredentials.password);
//     if (!isMatch) return res.status(401).json({ errorMessage: "Invalid username or password" });

//     res.status(200).json({
//       message: "Login successful",
//       type: user.userCredentials.type,
//       user: {
//         id: user._id,
//         firstname: user.firstname,
//         lastname: user.lastname,
//         username: user.userCredentials.username,
//         email: user.userCredentials.email,
//         role: user.userCredentials.type,
//       },
//     });
//   } catch (error) {
//     console.error("Login error:", error.message);
//     res.status(500).json({ errorMessage: "Server error, please try again later." });
//   }
// };

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

    // ✅ CREATE JWT
    const accessToken = generateAccessToken(user);

    res.status(200).json({
      message: "Login successful",
      accessToken,
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
    res.status(500).json({ errorMessage: "Server error, please try again later." });
  }
};

module.exports = { signup, verifyOtp, resendOtp, login, cleanupExpiredTempSignups };
