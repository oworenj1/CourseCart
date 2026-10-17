
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Account = require("../models/Accounts.cjs");
const { protect } = require("../middleware/authMiddleware.cjs");

const router = express.Router();

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const email = String(req.body.email || "")
      .trim()
      .toLowerCase();

    const password = req.body.password;

    if (!email || typeof password !== "string" || !password) {
      return res.status(400).json({
        message: "Email and password are required.",
      });
    }

    const account = await Account.findOne({ email }).select("+password");

    if (!account) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    if (
      account.status !== "active" ||
      account.isArchived
    ) {
      return res.status(403).json({
        message: "Your account is inactive or unavailable.",
      });
    }

    const passwordMatches = await bcrypt.compare(
      password,
      account.password
    );

    if (!passwordMatches) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is not configured.");

      return res.status(500).json({
        message: "Authentication is not configured.",
      });
    }

    const token = jwt.sign(
      { id: account._id.toString() },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    return res.json({
      message: "Login successful.",
      token,
      user: {
        id: account._id.toString(),
        firstName: account.firstName,
        lastName: account.lastName,
        email: account.email,
        role: account.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error.message);

    return res.status(500).json({
      message: "Unable to process login.",
    });
  }
});

// GET /api/auth/me
router.get("/me", protect, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
