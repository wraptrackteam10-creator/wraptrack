// server/controllers/authController.js (example path)
const nodemailer = require("nodemailer");
const User = require("../models/userModel");
const bcrypt = require("bcryptjs");

const generateOtp = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

const createTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error("Missing EMAIL_USER or EMAIL_PASS env variables");
  }
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

const sendEmail = async (toEmail, otp) => {
  const transporter = createTransporter();

  // optional: verify transporter before sending, helps surface auth problems
  try {
    await transporter.verify();
  } catch (err) {
    console.error("Email transporter verify failed:", err);
    throw new Error("Email transporter verification failed");
  }

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: toEmail,
      subject: "WrapTrack – Password Reset OTP",
      html: `
        <p>Your OTP code is:</p>
        <h2>${otp}</h2>
        <p>This code expires in <b>10 minutes</b>.</p>
      `,
    });
  } catch (err) {
    console.error("sendMail failed:", err);
    throw new Error("Failed to send email");
  }
};

// safer mask function
const maskEmailLocalPart = (email) => {
  if (!email || typeof email !== "string") return null;
  const parts = email.split("@");
  if (parts.length !== 2) return "****@****";
  const [local, domain] = parts;
  if (!local) return `****@${domain}`;
  // if local part is very short, keep first char and mask the rest
  if (local.length <= 2) {
    return `${local[0]}${"*".repeat(Math.max(0, local.length - 1))}@${domain}`;
  }
  // show first 2 and last char, mask middle (safe repeat)
  const middleCount = Math.max(0, local.length - 3);
  return `${local.slice(0, 2)}${"*".repeat(middleCount)}${local.slice(-1)}@${domain}`;
};

const requestOtp = async (req, res) => {
  const { username } = req.body;
  if (!username)
    return res.status(400).json({ errorMessage: "Username required" });

  try {
    const user = await User.findOne({ "userCredentials.username": username });
    if (!user)
      return res.status(404).json({ errorMessage: "User not found" });

    const email = user?.userCredentials?.email;
    if (!email) {
      console.error("User has no email set for username:", username);
      return res.status(500).json({ errorMessage: "No email on account" });
    }

    const otp = generateOtp();
    const hashedOtp = await bcrypt.hash(otp, 10);

    user.userCredentials.otpCode = hashedOtp;
    user.userCredentials.otpExpiresAt = new Date(Date.now() + 10 * 60000);
    user.userCredentials.otpUsed = false;

    // save OTP before attempting to send email
    await user.save();

    const emailMasked = maskEmailLocalPart(email);

    // send email and handle any errors
    try {
      await sendEmail(email, otp);
    } catch (emailErr) {
      console.error("Error sending OTP email to", email, emailErr);
      // Optional: you might want to clear the OTP if sending failed:
      // user.userCredentials.otpCode = null;
      // user.userCredentials.otpExpiresAt = null;
      // await user.save();
      return res.status(502).json({ errorMessage: "Failed to send OTP email" });
    }

    res.status(200).json({ message: "OTP sent", emailMasked });
  } catch (err) {
    console.error("requestOtp error:", err);
    res.status(500).json({ errorMessage: "Server error" });
  }
};

const resetWithOtp = async (req, res) => {
  const { username, otp, newPassword } = req.body;

  try {
    const user = await User.findOne({ "userCredentials.username": username });
    if (!user)
      return res.status(404).json({ errorMessage: "User not found" });

    const cred = user.userCredentials;

    if (!cred.otpCode || cred.otpUsed)
      return res.status(400).json({ errorMessage: "Invalid OTP request" });

    if (new Date() > cred.otpExpiresAt)
      return res.status(400).json({ errorMessage: "OTP expired" });

    const valid = await bcrypt.compare(otp, cred.otpCode);
    if (!valid)
      return res.status(401).json({ errorMessage: "Invalid OTP" });

    user.userCredentials.password = await bcrypt.hash(newPassword, 10);
    cred.otpUsed = true;
    cred.otpCode = null;
    cred.otpExpiresAt = null;

    await user.save();
    res.status(200).json({ message: "Password updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ errorMessage: "Server error" });
  }
};

module.exports = { requestOtp, resetWithOtp };