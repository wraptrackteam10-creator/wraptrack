const User = require("../models/userModel");
const bcrypt = require("bcryptjs");

// ✅ GET /api/users?archived=true
const getUsers = async (req, res) => {
  try {
    const showArchived = req.query.archived === "true";

    const filter = showArchived
      ? { archivedAt: { $ne: null } }
      : { archivedAt: null };

    const users = await User.find(filter).sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

// ✅ POST /api/users
const createUser = async (req, res) => {
  const { firstname, lastname, username, email, password, type, institute, program } = req.body;

  if (!firstname || !lastname || !username || !email || !password || !type) {
    return res.status(400).json({ error: "All required fields must be provided" });
  }

  const usernameRegex = /^[a-zA-Z0-9_]{5,}$/;
  if (!usernameRegex.test(username)) {
    return res.status(400).json({ error: "Username must be at least 5 characters and alphanumeric" });
  }

  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
  if (!passwordRegex.test(password)) {
    return res.status(400).json({ error: "Password must be at least 8 characters long and include an uppercase letter, a lowercase letter, a number, and a special character." });
  }

  try {
    const existingUser = await User.findOne({ 
      $or: [
        { "userCredentials.username": username },
        { "userCredentials.email": email }
      ]
    });
    
    if (existingUser) {
      return res.status(400).json({ error: "Username or Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      firstname,
      lastname,
      userCredentials: {
        institute: institute || "N/A",
        program: program || "N/A",
        username,
        email,
        password: hashedPassword,
        type: type.toLowerCase(),
        status: "Active"
      }
    });

    await newUser.save();
    res.status(201).json({ message: "Account created successfully", user: newUser });
  } catch (error) {
    console.error("Create user error:", error);
    res.status(500).json({ error: "Failed to create user" });
  }
};


// ✅ Get a single user by ID
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (error) {
    console.error("Fetch user error:", error);
    res.status(500).json({ error: "Failed to fetch user" });
  }
};

// Update user
const updateUser = async (req, res) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!updatedUser) return res.status(404).json({ error: "User not found" });

    res.json(updatedUser);
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({ error: "Failed to update user" });
  }
};

// Archive user (non-destructive) - sets archivedAt and archivedBy (if available)
const archiveUser = async (req, res) => {
  try {
    const id = req.params.id;

    const updated = await User.findByIdAndUpdate(
      id,
      {
        archivedAt: new Date(),
        archivedBy: req.user?._id || null,
        "userCredentials.status": "Inactive",
      },
      { new: true } // return updated doc
    );

    if (!updated) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(updated);
  } catch (error) {
    console.error("Archive user error:", error);
    res.status(500).json({ error: "Failed to archive user" });
  }
};

// ✅ Unarchive user
const unarchiveUser = async (req, res) => {
  try {
    const id = req.params.id;

    const updated = await User.findByIdAndUpdate(
      id,
      {
        archivedAt: null,
        archivedBy: null,
        "userCredentials.status": "Active",
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(updated);
  } catch (error) {
    console.error("Unarchive user error:", error);
    res.status(500).json({ error: "Failed to unarchive user" });
  }
};

// Delete user (kept for completeness — still destructive)
const deleteUser = async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser) return res.status(404).json({ error: "User not found" });

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ error: "Failed to delete user" });
  }
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  archiveUser,
  unarchiveUser,
  deleteUser,
};