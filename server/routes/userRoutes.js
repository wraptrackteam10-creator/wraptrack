const express = require("express");
const {
  getUsers,
  getUserById,
  updateUser,
  deleteUser
} = require("../controllers/userController");

const router = express.Router();

// User routes
router.get("/users", getUsers);
router.get("/users/:id", getUserById);
router.put("/users/:id", updateUser);    // <-- REQUIRED
router.delete("/users/:id", deleteUser); // <-- OPTIONAL but recommended

module.exports = router;
