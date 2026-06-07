// controllers/guestController.js
const User = require("../models/userModel");
const AuditLog = require("../models/auditLogModel");
const { generateAccessToken, generateRefreshToken } = require("../utils/jwt");

// Create and persist a guest user in the database
const createGuest = async (req, res) => {
  const { firstname = "Guest", lastname = "" } = req.body || {};

  try {
    // ✅ CREATE GUEST USER IN DATABASE
    const guestUser = new User({
      firstname: firstname || "Guest",
      lastname: lastname || "",
      userCredentials: {
        username: `guest_${Date.now()}`,
        email: `guest_${Date.now()}@wraptrack.local`,
        type: "visitor",
        status: "Active",
        password: "", // Empty password for guests
      },
      isGuest: true, // Flag to identify guest users
      guestCreatedAt: new Date(),
    });

    await guestUser.save();

    // ✅ GENERATE TOKEN WITH REAL DATABASE ID
    const accessToken = generateAccessToken(guestUser);
    const refreshToken = generateRefreshToken(guestUser);

    const isProduction = process.env.NODE_ENV === "production";
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: isProduction, // true in production
      sameSite: isProduction ? "none" : "lax",
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 30 * 60 * 1000, // 30 minutes
    });

    // ✅ CREATE AUDIT LOG FOR GUEST LOGIN
    try {
      await AuditLog.create({
        userId: guestUser._id,
        username: `GUEST_${guestUser._id}`,
        firstname: firstname || "Guest",
        lastname: lastname || "",
        action: "GUEST_LOGIN",
        details: `Guest user "${firstname} ${lastname}" logged in.`,
        ipAddress: req.ip || req.connection?.remoteAddress || "",
        userAgent: req.headers["user-agent"] || "",
        metadata: {
          guestId: guestUser._id.toString(),
          isGuest: true,
          sessionType: "guest_temporary",
        },
      });
    } catch (auditErr) {
      console.error("Audit log (GUEST_LOGIN) failed:", auditErr.message);
      // Don't fail the guest login if audit fails
    }

    return res.status(200).json({
      message: "Guest session created",
      user: {
        id: guestUser._id,
        firstname,
        lastname,
        role: "visitor",
      },
    });
  } catch (error) {
    console.error("Guest login error:", error.message);
    return res.status(500).json({ errorMessage: "Failed to create guest session." });
  }
};

module.exports = { createGuest };
