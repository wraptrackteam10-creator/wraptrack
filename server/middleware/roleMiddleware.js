// middleware/roleMiddleware.js

module.exports = (...allowedRoles) => {
  return (req, res, next) => {
    const userRole = (req.user?.role || "").toLowerCase();

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ error: "Access denied: insufficient permissions" });
    }

    next();
  };
};
