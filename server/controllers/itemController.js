const Item = require("../models/itemModel");
const Log = require("../models/logModel");
const Notification = require("../models/notificationModel");
const GuardLog = require("../models/guardLogModel");
const sharp = require("sharp");
const cloudinary = require("../config/cloudinary");
const stream = require("stream");

// ===============================================================
//  UPLOAD NEW ITEM (User Deposit)
// ===============================================================
const uploadItem = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const { userId, description, firstname, lastname, action } = req.body;

    const compressedImage = await sharp(req.file.buffer)
      .resize({ width: 800 })
      .jpeg({ quality: 60 })
      .toBuffer();

    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: "items" },
      async (error, result) => {
        if (error) return res.status(500).json({ error: "Cloudinary upload failed" });

        const newItem = new Item({
          userId,
          firstname,
          lastname,
          description,
          action: action || "Deposited",
          status: "Deposited",
          photoUrl: result.secure_url,
          depositedAt: new Date(),
          claimedAt: null,
          unclaimedAt: null,
        });

        await newItem.save();

        await Log.create({
          userId,
          itemId: newItem._id,
          action: "Deposited",
          status: "Deposited",
          description,
          photoUrl: result.secure_url,
        });

        await Notification.create({
          userId,
          message: `You deposited an item: "${description}".`,
          read: false,
        });

        res.json({
          message: "Item deposited successfully",
          item: newItem,
        });
      }
    );

    const bufferStream = new stream.PassThrough();
    bufferStream.end(compressedImage);
    bufferStream.pipe(uploadStream);
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Upload failed" });
  }
};

// ===============================================================
//  FETCH ITEMS
// ===============================================================
const getItems = async (req, res) => {
  try {
    const items = await Item.find().populate("userId", "firstname lastname type");
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch items" });
  }
};

const getItemPhoto = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item || !item.photoUrl) return res.status(404).json({ error: "Image not found" });
    res.json({ photoUrl: item.photoUrl });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch image" });
  }
};

// ===============================================================
//  AUTO UNCLAIM ITEMS
// ===============================================================
const autoUpdateUnclaimedItems = async () => {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const itemsToUnclaim = await Item.find({
      status: { $in: ["Deposited", "Pending Verification"] },
      createdAt: { $lt: startOfToday },
    });

    for (const item of itemsToUnclaim) {
      item.status = "Unclaimed";
      item.unclaimedAt = new Date();
      item.claimedAt = null;
      await item.save();

      await Log.create({
        userId: item.userId,
        itemId: item._id,
        firstname: item.firstname,
        lastname: item.lastname,
        description: item.description,
        photoUrl: item.photoUrl,
        action: "Auto-Unclaimed",
        status: "Unclaimed",
      });

      await Notification.create({
        userId: item.userId,
        message: `Your item "${item.description}" was marked as Unclaimed.`,
        read: false,
      });
    }

    console.log(`Auto-Unclaimed: ${itemsToUnclaim.length}`);
  } catch (error) {
    console.error("Auto Unclaim Error:", error);
  }
};

// ===============================================================
//  AUTO APPLY DAILY PENALTY FOR UNCLAIMED ITEMS
// ===============================================================
const autoApplyDailyPenalty = async () => {
  try {
    const now = new Date();

    // Start of today (00:00)
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );

    // Get all unclaimed items
    const unclaimedItems = await Item.find({ status: "Unclaimed" });

    let penalizedCount = 0;

    for (const item of unclaimedItems) {
      // If penalty was already applied today → skip
      if (item.lastPenaltyAt && item.lastPenaltyAt >= startOfToday) {
        continue;
      }

      // Apply penalty
      item.penalty += 1;
      item.lastPenaltyAt = now;

      await item.save();

      await Log.create({
        userId: item.userId,
        itemId: item._id,
        action: "Daily Penalty",
        status: "Unclaimed",
        description: item.description,
        photoUrl: item.photoUrl,
      });

      await Notification.create({
        userId: item.userId,
        message: `A penalty was added for your unclaimed item "${item.description}".`,
        read: false,
      });

      penalizedCount++;
    }

    console.log(`💸 Daily penalties applied: ${penalizedCount}`);
  } catch (error) {
    console.error("Auto Penalty Error:", error);
  }
};

// ===============================================================
//  AUTO ARCHIVE UNCLAIMED ITEMS
// ===============================================================
const autoArchiveUnclaimedItems = async () => {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const itemsToArchive = await Item.find({
      status: "Unclaimed",
      unclaimedAt: { $lte: sevenDaysAgo },
      action: { $ne: "Archive" },
    });

    for (const item of itemsToArchive) {
      item.action = "Archive";
      item.archivedAt = new Date();
      await item.save();

      await Log.create({
        userId: item.userId,
        itemId: item._id,
        action: "Auto-Archived",
        status: "Unclaimed",
        description: item.description,
        photoUrl: item.photoUrl,
      });

      await Notification.create({
        userId: item.userId,
        message: `Your item "${item.description}" was auto-archived after 7 days.`,
        read: false,
      });
    }

    console.log(`Auto-Archived: ${itemsToArchive.length}`);
  } catch (error) {
    console.error("Auto Archive Error:", error);
  }
};

// ===============================================================
//  UPDATE ITEM ACTION (ARCHIVE)
// ===============================================================
const updateItemAction = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body;

    if (action !== "Archive")
      return res.status(400).json({ error: "Invalid action value." });

    const item = await Item.findById(id);
    if (!item) return res.status(404).json({ error: "Item not found" });

    item.action = "Archive";
    item.archivedAt = new Date();
    item.archivedBy = req.user?._id || null;

    await item.save();

    await Log.create({
      userId: item.userId,
      itemId: item._id,
      action: "Archived",
      status: item.status,
      description: item.description,
      photoUrl: item.photoUrl,
    });

    res.json(item);
  } catch (error) {
    res.status(500).json({ error: "Failed to archive item" });
  }
};

const unarchiveItem = async (req, res) => {
  const item = await Item.findById(req.params.id);
  if (!item) return res.status(404).json({ error: "Item not found" });

  item.archivedAt = null;
  item.archivedBy = null;
  item.action = "Deposited";

  await item.save();
  res.json(item);
};

// ===============================================================
//  UPDATE ITEM STATUS (Guard / Admin)
// ===============================================================
const updateItemStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, guardId, guardName } = req.body;

    const item = await Item.findById(id);
    if (!item) return res.status(404).json({ error: "Item not found" });

    // Timestamp rules
    if (status === "Deposited") {
      item.claimedAt = null;
      item.unclaimedAt = null;
    } else if (status === "Unclaimed") {
      item.claimedAt = null;
      item.unclaimedAt = new Date();
    } else if (status === "Claimed") {
      if (!item.claimedAt) item.claimedAt = new Date();
      item.unclaimedAt = null;
      item.lastPenaltyAt = null;
    }

    item.status = status;
    await item.save();

    await Log.create({
      userId: item.userId,
      itemId: item._id,
      firstname: item.firstname,
      lastname: item.lastname,
      description: item.description,
      photoUrl: item.photoUrl,
      action: status === "Pending Verification" ? "Requested Claim" : status,
      status,
    });

    if (status === "Claimed") {
      await Notification.create({
        userId: item.userId,
        message: `Your item "${item.description}" has been claimed.`,
        read: false,
      });

      if (guardId) {
        await GuardLog.create({
          guardId,
          itemId: item._id,
          action: "Verified",
          description: `Guard ${guardName} verified item "${item.description}".`,
          photoUrl: item.photoUrl,
          timestamp: new Date(),
          owner: { firstname: item.firstname, lastname: item.lastname },
        });
      }
    }

    res.json({ message: "Status updated successfully", item });
  } catch (error) {
    console.error("Update status error:", error);
    res.status(500).json({ error: "Failed to update status" });
  }
};

// ===============================================================
//  ITEM SUMMARY
// ===============================================================
const getItemSummary = async (req, res) => {
  try {
    const totalDeposited = await Item.countDocuments();
    const claimedCount = await Item.countDocuments({ claimedAt: { $ne: null } });
    const pendingCount = await Item.countDocuments({ status: "Pending Verification" });

    res.json({
      deposited: totalDeposited,
      claimed: claimedCount,
      pending: pendingCount,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch summary data" });
  }
};

// ===============================================================
//  ADMIN UPDATE ITEM (Edit fields / status)
// ===============================================================
const updateItem = async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent overwriting depositedAt
    if ("depositedAt" in req.body) delete req.body.depositedAt;

    // Apply timestamp rules if admin edits status
    if ("status" in req.body) {
      const status = req.body.status;
      if (status === "Deposited") {
        req.body.claimedAt = null;
        req.body.unclaimedAt = null;
      } else if (status === "Claimed") {
        req.body.claimedAt = new Date();
        req.body.unclaimedAt = null;
      } else if (status === "Unclaimed") {
        req.body.claimedAt = null;
        req.body.unclaimedAt = new Date();
      }
    }

    const updatedItem = await Item.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    if (!updatedItem) return res.status(404).json({ error: "Item not found" });

    await Log.create({
      userId: updatedItem.userId,
      itemId: updatedItem._id,
      action: "Admin Update",
      status: updatedItem.status,
      description: updatedItem.description,
      photoUrl: updatedItem.photoUrl,
    });

    res.json(updatedItem);
  } catch (error) {
    console.error("Update item error:", error);
    res.status(500).json({ error: "Failed to update item" });
  }
};

// ===============================================================
//  DELETE ITEM
// ===============================================================
const deleteItem = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedItem = await Item.findByIdAndDelete(id);
    if (!deletedItem) return res.status(404).json({ error: "Item not found" });

    await Log.create({
      userId: deletedItem.userId,
      itemId: deletedItem._id,
      action: "Deleted",
      status: deletedItem.status,
      description: deletedItem.description,
      photoUrl: deletedItem.photoUrl,
    });

    res.json({ message: "Item deleted successfully", deletedItem });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete item" });
  }
};

// ===============================================================
// EXPORT
// ===============================================================
module.exports = {
  uploadItem,
  getItems,
  getItemPhoto,
  updateItemAction,
  unarchiveItem,
  updateItemStatus,
  autoUpdateUnclaimedItems,
  autoApplyDailyPenalty,
  autoArchiveUnclaimedItems,
  getItemSummary,
  updateItem,
  deleteItem,
};
