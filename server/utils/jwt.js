const jwt = require("jsonwebtoken");

function normalizeRole(type) {
  const t = (type || "").toLowerCase();

  if (t === "admin") return "admin";
  if (t === "guard") return "guard";
  if (["student", "faculty", "visitor"].includes(t)) return "user";
  return "guest";
}

const generateAccessToken = (user) => {
  const role = normalizeRole(user.userCredentials.type);

  return jwt.sign(
    {
      sub: user._id, // recommended
      userId: user._id,
      username: user.userCredentials.username,
      role,          // normalized role
      rawRole: user.userCredentials.type, // optional (for UI)
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "15m" }
  );
};

module.exports = { generateAccessToken };
