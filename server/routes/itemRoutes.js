const express = require("express");
const multer = require("multer");
const authMiddleware = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const {
  uploadItem, getItems, getItemPhoto, updateItemAction, unarchiveItem,
  updateItemStatus, getItemSummary, updateItem, deleteItem,
} = require("../controllers/itemController");

const router = express.Router();

// Multer config
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// ------------------- User Routes -------------------
// Users, Guards, Admins can upload items
router.post("/upload", authMiddleware, authorizeRoles("user", "guard", "admin"), upload.single("photo"), uploadItem);
router.get("/items", authMiddleware, authorizeRoles("user", "guard", "admin"), getItems);
router.get("/items/:id/photo", authMiddleware, authorizeRoles("user", "guard", "admin"), getItemPhoto);
router.patch("/items/:id/action", authMiddleware, authorizeRoles("user", "guard", "admin"), updateItemAction);
router.patch("/items/:id/unarchive", authMiddleware, authorizeRoles("user", "guard", "admin"), unarchiveItem);

// ------------------- Guard Routes -------------------
// Only guards and admins can update actions/status
router.put("/items/:id/status", authMiddleware, authorizeRoles("user", "guard", "admin"), updateItemStatus);

// ------------------- Guard/Admin -------------------
// Guard/Admin summary view
router.get("/items/summary", authMiddleware, authorizeRoles("guard", "admin"), getItemSummary);

// ------------------- Admin Routes -------------------
// Only admin can update/delete items
router.put("/items/:id", authMiddleware, authorizeRoles("admin"), updateItem);
router.delete("/items/:id", authMiddleware, authorizeRoles("admin"), deleteItem);

module.exports = router;
