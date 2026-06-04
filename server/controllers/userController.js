const User = require("../models/userModel");
const bcrypt = require("bcryptjs");
const AuditLog = require("../models/auditLogModel");

// Helper function to remove password from responses
const sanitizeUser = (user) => {
  const obj = user.toObject ? user.toObject() : { ...user };

  if (obj.userCredentials) {
    delete obj.userCredentials.password;
    delete obj.userCredentials.otpCode;
  }

  return obj;
};

// GET USERS
const getUsers = async (req, res) => {
  try {
    const showArchived = req.query.archived === "true";

    const filter = showArchived
      ? { archivedAt: { $ne: null } }
      : { archivedAt: null };

    const users = await User.find(filter).sort({ createdAt: -1 });

    res.json(users.map(sanitizeUser));
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

// CREATE USER
const createUser = async (req, res) => {
  const {
    firstname,
    lastname,
    username,
    email,
    password,
    type,
    institute,
    program,
  } = req.body;

  if (!firstname || !lastname || !username || !email || !password || !type) {
    return res.status(400).json({
      error: "All required fields must be provided",
    });
  }

  const normalizedUsername = username.trim().toLowerCase();
  const normalizedEmail = email.trim().toLowerCase();

  const usernameRegex = /^[a-zA-Z0-9_]{5,}$/;

  if (!usernameRegex.test(normalizedUsername)) {
    return res.status(400).json({
      error: "Username must be at least 5 characters and alphanumeric",
    });
  }

  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;

  if (!passwordRegex.test(password)) {
    return res.status(400).json({
      error:
        "Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.",
    });
  }

  try {
    const existingUser = await User.findOne({
      $or: [
        { "userCredentials.username": normalizedUsername },
        { "userCredentials.email": normalizedEmail },
      ],
    });

    if (existingUser) {
      return res.status(400).json({
        error: "Username or Email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      firstname,
      lastname,
      userCredentials: {
        institute: institute || "N/A",
        program: program || "N/A",
        username: normalizedUsername,
        email: normalizedEmail,
        password: hashedPassword,
        type: type.toLowerCase(),
        status: "Active",
      },
    });

    await newUser.save();

    // ✅ Audit log for CREATE_USER
    try {
      await AuditLog.create({
        userId: req.user?.id || req.user?._id || null,
        username: req.user?.username || "",
        firstname: req.user?.firstname || "",
        lastname: req.user?.lastname || "",
        action: "CREATE_USER",
        details: `User "${normalizedUsername}" (${type}) was created.`,
        metadata: {
          createdUserId: newUser._id,
          createdUsername: normalizedUsername,
          role: type,
        },
      });
    } catch (auditErr) {
      console.error("Audit log (CREATE_USER) failed:", auditErr.message);
    }

    res.status(201).json({
      message: "Account created successfully",
      user: sanitizeUser(newUser),
    });
  } catch (error) {
    console.error("Create user error:", error);
    res.status(500).json({ error: "Failed to create user" });
  }
};

// GET USER BY ID
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    res.json(sanitizeUser(user));
  } catch (error) {
    console.error("Fetch user error:", error);
    res.status(500).json({ error: "Failed to fetch user" });
  }
};

// UPDATE USER
const updateUser = async (req, res) => {
  try {
    const {
      firstname,
      lastname,
      username,  // ✅ ADD THIS
      institute,
      program,
      email,
      status,
      type,
    } = req.body;

    // Validate username if provided
    if (username) {
      const normalizedUsername = username.trim().toLowerCase();
      const type_val = type || req.body.userCredentials?.type; // Get type for validation
      
      if (type_val === "student") {
        if (!/^\d{4}-\d{4}$/.test(normalizedUsername)) {
          return res.status(400).json({
            error: "Invalid Login ID format. Use 0000-0000 for students.",
          });
        }
      } else {
        if (normalizedUsername.length < 8 || normalizedUsername.length > 16) {
          return res.status(400).json({
            error: "Login ID must be 8-16 characters for non-students.",
          });
        }
      }

      // Check if username already exists (exclude current user)
      const existingUser = await User.findOne({
        "userCredentials.username": normalizedUsername,
        _id: { $ne: req.params.id }, // Exclude current user
      });

      if (existingUser) {
        return res.status(400).json({
          error: "Username already taken",
        });
      }
    }

    const updateData = {
      firstname,
      lastname,
      "userCredentials.institute": institute,
      "userCredentials.program": program,
      "userCredentials.email": email?.trim().toLowerCase(),
      "userCredentials.status": status,
      "userCredentials.type": type,
      "userCredentials.username": username?.trim(), // ✅ ADD THIS
    };

    Object.keys(updateData).forEach(
      (key) => updateData[key] === undefined && delete updateData[key]
    );

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedUser) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    // ✅ Audit log for UPDATE_USER
    try {
      await AuditLog.create({
        userId: req.user?.id || req.user?._id || null,
        username: req.user?.username || "",
        firstname: req.user?.firstname || "",
        lastname: req.user?.lastname || "",
        action: "UPDATE_USER",
        details: `User "${updatedUser.userCredentials?.username}" was updated.`,
        // ipAddress: req.ip || req.connection?.remoteAddress || "",
        // userAgent: req.headers["user-agent"] || "",
        metadata: {
          targetUserId: req.params.id,
          updatedFields: Object.keys(updateData),
        },
      });
    } catch (auditErr) {
      console.error("Audit log (UPDATE_USER) failed:", auditErr.message);
    }

    res.json(sanitizeUser(updatedUser));
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({ error: "Failed to update user" });
  }
};

// ARCHIVE USER
const archiveUser = async (req, res) => {
  try {
    const updated = await User.findByIdAndUpdate(
      req.params.id,
      {
        archivedAt: new Date(),
        archivedBy: req.user?._id || null,
        "userCredentials.status": "Inactive",
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    // ✅ Audit log for ARCHIVE_USER
    try {
      await AuditLog.create({
        userId: req.user?.id || req.user?._id || null,
        username: req.user?.username || "",
        firstname: req.user?.firstname || "",
        lastname: req.user?.lastname || "",
        action: "ARCHIVE_USER",
        details: `User "${updated.userCredentials?.username}" was archived.`,
        metadata: {
          targetUserId: req.params.id,
          targetUsername: updated.userCredentials?.username,
        },
      });
    } catch (auditErr) {
      console.error("Audit log (ARCHIVE_USER) failed:", auditErr.message);
    }

    res.json(sanitizeUser(updated));
  } catch (error) {
    console.error("Archive user error:", error);
    res.status(500).json({
      error: "Failed to archive user",
    });
  }
};

// UNARCHIVE USER
const unarchiveUser = async (req, res) => {
  try {
    const updated = await User.findByIdAndUpdate(
      req.params.id,
      {
        archivedAt: null,
        archivedBy: null,
        "userCredentials.status": "Active",
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    // ✅ Audit log for UNARCHIVE_USER
    try {
      await AuditLog.create({
        userId: req.user?.id || req.user?._id || null,
        username: req.user?.username || "",
        firstname: req.user?.firstname || "",
        lastname: req.user?.lastname || "",
        action: "UNARCHIVE_USER",
        details: `User "${updated.userCredentials?.username}" was unarchived.`,
        metadata: {
          targetUserId: req.params.id,
          targetUsername: updated.userCredentials?.username,
        },
      });
    } catch (auditErr) {
      console.error("Audit log (UNARCHIVE_USER) failed:", auditErr.message);
    }

    res.json(sanitizeUser(updated));
  } catch (error) {
    console.error("Unarchive user error:", error);
    res.status(500).json({
      error: "Failed to unarchive user",
    });
  }
};

// DELETE USER
const deleteUser = async (req, res) => {
  try {
    const deleted = await User.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    // ✅ Audit log for DELETE_USER
    try {
      await AuditLog.create({
        userId: req.user?.id || req.user?._id || null,
        username: req.user?.username || "",
        firstname: req.user?.firstname || "",
        lastname: req.user?.lastname || "",
        action: "DELETE_USER",
        details: `User "${deleted.userCredentials?.username}" was permanently deleted.`,
        metadata: {
          deletedUserId: req.params.id,
          deletedUsername: deleted.userCredentials?.username,
        },
      });
    } catch (auditErr) {
      console.error("Audit log (DELETE_USER) failed:", auditErr.message);
    }

    res.json({ message: "User deleted successfully", user: sanitizeUser(deleted) });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ error: "Failed to delete user" });
  }
};

module.exports = {
  getUsers,
  createUser,
  getUserById,
  updateUser,
  archiveUser,
  unarchiveUser,
  deleteUser,
};
