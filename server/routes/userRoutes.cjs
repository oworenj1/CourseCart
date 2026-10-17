const express = require("express");
const bcrypt = require("bcryptjs");
const Account = require("../models/Accounts.cjs");
const { protect, authorize } = require("../middleware/authMiddleware.cjs");

const router = express.Router();

// Every User Management endpoint is Admin-only.
router.use(protect, authorize("admin"));

const allowedRoles = ["admin", "cashier", "inventory"];
const allowedStatuses = ["active", "inactive"];

const publicAccount = (account) => ({
  id: account._id.toString(),
  firstName: account.firstName,
  lastName: account.lastName,
  email: account.email,
  role: account.role,
  status: account.status,
  isArchived: account.isArchived,
  archivedAt: account.archivedAt,
  createdAt: account.createdAt,
  updatedAt: account.updatedAt,
});

// GET /api/users?includeArchived=true
router.get("/", async (req, res) => {
  try {
    const filter = {};
    if (String(req.query.includeArchived).toLowerCase() !== "true") {
      filter.isArchived = false;
    }

    const accounts = await Account.find(filter)
      .select("-password")
      .sort({ createdAt: -1 });

    return res.json({ users: accounts.map(publicAccount) });
  } catch (error) {
    console.error("List users error:", error.message);
    return res.status(500).json({ message: "Unable to load user accounts." });
  }
});

// POST /api/users
router.post("/", async (req, res) => {
  try {
    const firstName = String(req.body.firstName || "").trim();
    const lastName = String(req.body.lastName || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = req.body.password;
    const role = String(req.body.role || "cashier").trim().toLowerCase();

    if (!firstName || !lastName || !email || typeof password !== "string") {
      return res.status(400).json({
        message: "First name, last name, email, and password are required.",
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: "Enter a valid email address." });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters long.",
      });
    }

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid account role." });
    }

    const existing = await Account.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const account = await Account.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role,
      status: "active",
      isArchived: false,
      archivedAt: null,
    });

    return res.status(201).json({
      message: "User account created successfully.",
      user: publicAccount(account),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    console.error("Create user error:", error.message);
    return res.status(500).json({ message: "Unable to create the user account." });
  }
});

// PATCH /api/users/:id
// Password is optional; when provided, it is securely hashed before saving.
router.patch("/:id", async (req, res) => {
  try {
    const account = await Account.findById(req.params.id).select("+password");
    if (!account || account.isArchived) {
      return res.status(404).json({ message: "User account not found." });
    }

    const isSelf = account._id.toString() === req.user.id;
    if (isSelf) {
      return res.status(403).json({
        message: "You cannot edit your own Admin account. Ask another Admin to manage it.",
      });
    }

    const { firstName, lastName, email, role, status, password } = req.body;

    if (firstName !== undefined) {
      if (typeof firstName !== "string" || !firstName.trim()) {
        return res.status(400).json({ message: "First name cannot be empty." });
      }
      account.firstName = firstName.trim();
    }

    if (lastName !== undefined) {
      if (typeof lastName !== "string" || !lastName.trim()) {
        return res.status(400).json({ message: "Last name cannot be empty." });
      }
      account.lastName = lastName.trim();
    }

    if (email !== undefined) {
      const normalizedEmail = String(email).trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
        return res.status(400).json({ message: "Enter a valid email address." });
      }
      const duplicate = await Account.findOne({
        email: normalizedEmail,
        _id: { $ne: account._id },
      });
      if (duplicate) {
        return res.status(409).json({ message: "An account with this email already exists." });
      }
      account.email = normalizedEmail;
    }

    if (role !== undefined) {
      if (!allowedRoles.includes(role)) {
        return res.status(400).json({ message: "Invalid account role." });
      }
      account.role = role;
    }

    if (status !== undefined) {
      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid account status." });
      }
      account.status = status;
    }

    if (password !== undefined) {
      if (typeof password !== "string" || password.length < 8) {
        return res.status(400).json({
          message: "New password must be at least 8 characters long.",
        });
      }
      account.password = await bcrypt.hash(password, 10);
    }

    await account.save();

    return res.json({
      message: "User account updated successfully.",
      user: publicAccount(account),
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid user account ID." });
    }
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    console.error("Update user error:", error.message);
    return res.status(500).json({ message: "Unable to update the user account." });
  }
});

// PATCH /api/users/:id/archive
// Soft archive preserves the account record instead of permanently deleting it.
router.patch("/:id/archive", async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({
        message: "You cannot archive your own account.",
      });
    }

    const account = await Account.findById(req.params.id);
    if (!account || account.isArchived) {
      return res.status(404).json({ message: "User account not found." });
    }

    account.isArchived = true;
    account.archivedAt = new Date();
    account.status = "inactive";
    await account.save();

    return res.json({
      message: "User account archived successfully.",
      user: publicAccount(account),
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid user account ID." });
    }
    console.error("Archive user error:", error.message);
    return res.status(500).json({ message: "Unable to archive the user account." });
  }
});

// PATCH /api/users/:id/restore
router.patch("/:id/restore", async (req, res) => {
  try {
    const account = await Account.findById(req.params.id);
    if (!account || !account.isArchived) {
      return res.status(404).json({ message: "Archived user account not found." });
    }

    account.isArchived = false;
    account.archivedAt = null;
    account.status = "active";
    await account.save();

    return res.json({
      message: "User account restored successfully.",
      user: publicAccount(account),
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid user account ID." });
    }
    console.error("Restore user error:", error.message);
    return res.status(500).json({ message: "Unable to restore the user account." });
  }
});

module.exports = router;
