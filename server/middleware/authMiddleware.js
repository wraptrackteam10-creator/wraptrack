const jwt = require("jsonwebtoken");

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ errorMessage: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ errorMessage: "Invalid or expired token" });
    }

    req.user = decoded; // { userId, username, role, iat, exp }
    next();
  });
};

module.exports = authenticateToken;
