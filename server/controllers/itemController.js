const mongoose = require("mongoose");
const Item = require("../models/itemModel");
const GuardLog = require("../models/guardLogModel");
const sharp = require("sharp");
const cloudinary = require("../config/cloudinary");
const stream = require("stream");
const bus = require("../utils/eventBus"); // event emitter

const VALID_ROLES = ["admin", "guard", "user"];

function resolveRoleFromReq(req) {
  const candidate = (req.user?.role || req.body?.role || req.query?.role || "").toString().toLowerCase();
  return VALID_ROLES.includes(candidate) ? candidate : null;
}

function ensureArchivedPath(item, role) {
  if (!item.archived) item.archived = {};
  if (!item.archived[role]) {
    item.archived[role] = { isArchived: false, at: null, by: null };
  }
}

async function addArchiveForRole(item, role, byId = null) {
  if (!role || !VALID_ROLES.includes(role)) return;
  ensureArchivedPath(item, role);
  const now = new Date();
  item.archived[role].isArchived = true;
  item.archived[role].at = now;
  item.archived[role].by = byId || null;
  item.action = "Archive";
  await item.save();
}

async function removeArchiveForRole(item, role) {
  if (!item.archived) item.archived = {};
  if (role && item.archived[role]) {
    item.archived[role].isArchived = false;
    item.archived[role].at = null;
    item.archived[role].by = null;
  }
  const anyArchived = Object.values(item.archived || {}).some((r) => r && r.isArchived);
  if (!anyArchived) item.action = "Deposited";
  await item.save();
}

// Utility: transform item(s) for the requesting role by adding archivedAt/archivedBy fields
function transformItemForRole(item, role) {
  if (!item) return item;
  const obj = typeof item.toObject === "function" ? item.toObject() : JSON.parse(JSON.stringify(item));
  const arch = obj.archived && role && obj.archived[role] ? obj.archived[role] : null;
  obj.archivedAt = arch?.at || null;
  obj.archivedBy = arch?.by || null;
  // Keep original archived object too for other uses
  return obj;
}

// UPLOAD NEW ITEM
const uploadItem = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    let { userId, description, firstname, lastname, action } = req.body;
    firstname = firstname || "";
    lastname = lastname || "";
    description = description || "";

    let resolvedUserId = null;
    let guestId = null;
    let guestName = null;
    if (userId) {
      if (typeof userId === "string" && userId.startsWith("guest_")) {
        guestId = userId;
        guestName = `${firstname} ${lastname}`.trim() || null;
      } else if (mongoose.Types.ObjectId.isValid(userId)) resolvedUserId = userId;
      else {
        guestId = userId;
        guestName = `${firstname} ${lastname}`.trim() || null;
      }
    }

    const compressedImage = await sharp(req.file.buffer).resize({ width: 800 }).jpeg({ quality: 60 }).toBuffer();

    const uploadStream = cloudinary.uploader.upload_stream({ folder: "items" }, async (error, result) => {
      if (error) {
        console.error("Cloudinary upload failed:", error);
        return res.status(500).json({ error: "Cloudinary upload failed" });
      }

      const newItemData = {
        firstname,
        lastname,
        description,
        action: action || "Deposited",
        status: "Deposited",
        photoUrl: result.secure_url,
        depositedAt: new Date(),
        claimedAt: null,
        unclaimedAt: null,
        archived: {
          admin: { isArchived: false, at: null, by: null },
          guard: { isArchived: false, at: null, by: null },
          user: { isArchived: false, at: null, by: null },
        },
        penalty: 0,
        lastPenaltyAt: null,
      };

      if (resolvedUserId) newItemData.userId = resolvedUserId;
      if (guestId) {
        newItemData.guestId = guestId;
        newItemData.guestName = guestName;
      }

      const newItem = new Item(newItemData);
      await newItem.save();

      // Emit event instead of creating logs/notifications inline
      bus.emit("item:created", { item: newItem.toObject(), description, actor: { id: req.user?.id || null, role: req.user?.role || null } });

      // send transformed item for current requester's role
      const viewerRole = resolveRoleFromReq(req) || "user";
      res.json({ message: "Item deposited successfully", item: transformItemForRole(newItem, viewerRole) });
    });

    const bufferStream = new stream.PassThrough();
    bufferStream.end(compressedImage);
    bufferStream.pipe(uploadStream);
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Upload failed" });
  }
};

// GET ITEMS
const getItems = async (req, res) => {
  try {
    const viewerRole = resolveRoleFromReq(req) || "user";
    const showArchived = req.query?.archived === "true";

    let query;
    if (showArchived) {
      query = { [`archived.${viewerRole}.isArchived`]: true };
    } else {
      // not archived for this viewer role
      query = {
        $or: [
          { [`archived.${viewerRole}.isArchived`]: { $exists: false } },
          { [`archived.${viewerRole}.isArchived`]: false },
        ],
      };
    }

    const items = await Item.find(query).populate("userId", "firstname lastname type");
    // transform each item to include archivedAt / archivedBy for this viewer role
    const transformed = items.map((it) => transformItemForRole(it, viewerRole));
    res.json(transformed);
  } catch (error) {
    console.error("getItems error:", error);
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

const autoUpdateUnclaimedItems = async () => {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const itemsToUnclaim = await Item.find({ status: { $in: ["Deposited", "Pending Verification"] }, createdAt: { $lt: startOfToday } });
    for (const item of itemsToUnclaim) {
      item.status = "Unclaimed";
      item.unclaimedAt = new Date();
      item.claimedAt = null;
      await item.save();

      bus.emit("item:statusChanged", { item: item.toObject(), status: "Unclaimed", actor: { id: null, role: "system" } });
    }
    console.log(`Auto-Unclaimed: ${itemsToUnclaim.length}`);
  } catch (error) {
    console.error("Auto Unclaim Error:", error);
  }
};

const autoApplyDailyPenalty = async () => {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const unclaimedItems = await Item.find({ status: "Unclaimed" });

    let penalizedCount = 0;
    for (const item of unclaimedItems) {
      if (item.lastPenaltyAt && item.lastPenaltyAt >= startOfToday) continue;
      item.penalty += 1;
      item.lastPenaltyAt = now;
      await item.save();

      bus.emit("item:penaltyApplied", { item: item.toObject(), actor: { id: null, role: "system" } });
      penalizedCount++;
    }
    console.log(`💸 Daily penalties applied: ${penalizedCount}`);
  } catch (error) {
    console.error("Auto Penalty Error:", error);
  }
};

const autoArchiveUnclaimedItems = async () => {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const itemsToArchive = await Item.find({ status: "Unclaimed", unclaimedAt: { $lte: sevenDaysAgo }, action: { $ne: "Archive" } });

    for (const item of itemsToArchive) {
      await addArchiveForRole(item, "user", null);
      bus.emit("item:archived", { item: item.toObject(), role: "user", actor: { id: null, role: "system" } });
    }
    console.log(`Auto-Archived: ${itemsToArchive.length}`);
  } catch (error) {
    console.error("Auto Archive Error:", error);
  }
};

// Update item action (archive) - simplified
const updateItemAction = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body;
    if (action !== "Archive") return res.status(400).json({ error: "Invalid action value." });

    const item = await Item.findById(id);
    if (!item) return res.status(404).json({ error: "Item not found" });

    const role = resolveRoleFromReq(req) || (req.body.role || "admin");
    const byId = req.user?._id || req.user?.id || null;

    await addArchiveForRole(item, role, byId);
    bus.emit("item:archived", { item: item.toObject(), role, actor: { id: byId, role: req.user?.role } });

    const fresh = await Item.findById(id).populate("userId", "firstname lastname type");
    res.json(transformItemForRole(fresh, role));
  } catch (error) {
    console.error("Archive error:", error);
    res.status(500).json({ error: "Failed to archive item" });
  }
};

const unarchiveItem = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await Item.findById(id);
    if (!item) return res.status(404).json({ error: "Item not found" });

    const role = resolveRoleFromReq(req) || (req.body.role || "user");
    await removeArchiveForRole(item, role);
    bus.emit("item:unarchived", { item: item.toObject(), role, actor: { id: req.user?.id || null, role: req.user?.role } });

    const fresh = await Item.findById(id).populate("userId", "firstname lastname type");
    res.json(transformItemForRole(fresh, role));
  } catch (error) {
    console.error("Unarchive error:", error);
    res.status(500).json({ error: "Failed to unarchive item" });
  }
};

const updateItemStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, guardId, guardName } = req.body;

    const item = await Item.findById(id);
    if (!item) return res.status(404).json({ error: "Item not found" });

    if (status === "Deposited") { item.claimedAt = null; item.unclaimedAt = null; }
    else if (status === "Unclaimed") { item.claimedAt = null; item.unclaimedAt = new Date(); }
    else if (status === "Claimed") { if (!item.claimedAt) item.claimedAt = new Date(); item.unclaimedAt = null; item.penalty = 0; item.lastPenaltyAt = null; }

    item.status = status;
    await item.save();

    bus.emit("item:statusChanged", { item: item.toObject(), status, actor: { id: req.user?.id || null, role: req.user?.role } });

    if (status === "Claimed" && guardId) {
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

    const viewerRole = resolveRoleFromReq(req) || "user";
    const fresh = await Item.findById(id).populate("userId", "firstname lastname type");
    res.json(transformItemForRole(fresh, viewerRole));
  } catch (error) {
    console.error("Update status error:", error);
    res.status(500).json({ error: "Failed to update status" });
  }
};

const getItemSummary = async (req, res) => {
  try {
    const totalDeposited = await Item.countDocuments();
    const claimedCount = await Item.countDocuments({ claimedAt: { $ne: null } });
    const pendingCount = await Item.countDocuments({ status: "Pending Verification" });
    res.json({ deposited: totalDeposited, claimed: claimedCount, pending: pendingCount });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch summary data" });
  }
};

const updateItem = async (req, res) => {
  try {
    const { id } = req.params;
    if ("depositedAt" in req.body) delete req.body.depositedAt;

    if ("status" in req.body) {
      const status = req.body.status;
      if (status === "Deposited") { req.body.claimedAt = null; req.body.unclaimedAt = null; }
      else if (status === "Claimed") { req.body.claimedAt = new Date(); req.body.unclaimedAt = null; }
      else if (status === "Unclaimed") { req.body.claimedAt = null; req.body.unclaimedAt = new Date(); }
    }

    const updatedItem = await Item.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    if (!updatedItem) return res.status(404).json({ error: "Item not found" });

    bus.emit("item:statusChanged", { item: updatedItem.toObject(), status: updatedItem.status, actor: { id: req.user?.id || null, role: req.user?.role } });

    const viewerRole = resolveRoleFromReq(req) || "user";
    res.json(transformItemForRole(updatedItem, viewerRole));
  } catch (error) {
    console.error("Update item error:", error);
    res.status(500).json({ error: "Failed to update item" });
  }
};

const deleteItem = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedItem = await Item.findByIdAndDelete(id);
    if (!deletedItem) return res.status(404).json({ error: "Item not found" });

    bus.emit("item:deleted", { item: deletedItem.toObject(), actor: { id: req.user?.id || null, role: req.user?.role } });

    res.json({ message: "Item deleted successfully", deletedItem });
  } catch (error) {
    console.error("Delete item error:", error);
    res.status(500).json({ error: "Failed to delete item" });
  }
};

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