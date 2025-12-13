const express = require("express");
const multer = require("multer");
const {
  uploadItem, getItems, getItemPhoto, updateItemAction,
  updateItemStatus, getItemSummary, updateItem, deleteItem,
} = require("../controllers/itemController");

const router = express.Router();

// Multer config (store file in memory, then save to MongoDB)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Routes CRUD for user
router.post("/upload", upload.single("photo"), uploadItem); // Create
router.get("/items", getItems); // Read
router.get("/items/:id/photo", getItemPhoto);
router.patch("/items/:id/action", updateItemAction); // Update
router.put("/items/:id/status", updateItemStatus); 

// Routes CRUD for guard
router.get("/items/summary", getItemSummary);

// Routes for Admin
router.put("/items/:id", updateItem);
router.delete("/items/:id", deleteItem);

module.exports = router;