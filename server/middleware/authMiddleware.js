const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  try {

    const token = req.cookies?.accessToken;
    if (!token) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);

    req.user = {
      id: payload.sub || payload.userId,
      role: payload.role,
      rawRole: payload.rawRole,
      username: payload.username,
    };

    next();
  } catch (err) {
    console.error("Auth middleware error:", err.message);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};
