const express = require("express");
const {
  getUsers,
  getUserById,
  archiveUser,
  unarchiveUser,
  updateUser,
  deleteUser
} = require("../controllers/userController");
const authMiddleware = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

// User routes
router.get("/users", authMiddleware, authorizeRoles("guard", "admin"), getUsers);
router.get("/users/:id", getUserById);
router.patch("/users/:id/archive", authMiddleware, authorizeRoles("guard", "admin"), archiveUser);
router.patch("/users/:id/unarchive", authMiddleware, authorizeRoles("guard", "admin"), unarchiveUser);
router.put("/users/:id", authMiddleware, authorizeRoles("admin"), updateUser);    // <-- REQUIRED
router.delete("/users/:id", authMiddleware, authorizeRoles("admin"), deleteUser); // <-- OPTIONAL but recommended

module.exports = router;
