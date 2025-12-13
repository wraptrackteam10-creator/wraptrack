const nodemailer = require("nodemailer");
const User = require("../models/userModel");
const bcrypt = require("bcryptjs");

const generateOtp = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

const sendEmail = async (toEmail, otp) => {
  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

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
};

const requestOtp = async (req, res) => {
  const { username } = req.body;
  if (!username)
    return res.status(400).json({ errorMessage: "Username required" });

  try {
    const user = await User.findOne({ "userCredentials.username": username });
    if (!user)
      return res.status(404).json({ errorMessage: "User not found" });

    const otp = generateOtp();
    const hashedOtp = await bcrypt.hash(otp, 10);

    user.userCredentials.otpCode = hashedOtp;
    user.userCredentials.otpExpiresAt = new Date(Date.now() + 10 * 60000);
    user.userCredentials.otpUsed = false;

    await user.save();

    const email = user.userCredentials.email;
    const [name, domain] = email.split("@");
    const emailMasked = `${name.slice(0,2)}${"*".repeat(name.length - 3)}${name.slice(-1)}@${domain}`;

    await sendEmail(email, otp);

    res.status(200).json({ message: "OTP sent", emailMasked });
  } catch (err) {
    console.error(err);
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
