// controllers/guestController.js
const { Types } = require("mongoose");
const { generateAccessToken } = require("../utils/jwt");

// Optionally persist a Guest model; here we create a transient guest id only.
const createGuest = (req, res) => {
  const { firstname = "Guest", lastname = "" } = req.body || {};

  // Create a minimal guest 'user' payload (not persisted here).
  const guestUser = {
    _id: new Types.ObjectId(),
    firstname,
    lastname,
    userCredentials: { type: "visitor" },
  };

  const accessToken = generateAccessToken(guestUser);

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 15 * 60 * 1000, // same as login
  });

  return res.status(200).json({
    message: "Guest session created",
    user: {
      id: guestUser._id,
      firstname,
      lastname,
      role: "visitor",
    },
  });
};

module.exports = { createGuest };