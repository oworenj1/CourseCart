
const express = require("express");
const Category = require("../models/Categories.cjs");
const { protect, authorize } = require("../middleware/authMiddleware.cjs");

const router = express.Router();

// Require authentication for all category endpoints.
router.use(protect);

// GET all active categories
router.get("/", authorize("admin", "cashier", "inventory"), async (req, res) => {
  try {
    const categories = await Category.find({
      isArchived: { $ne: true },
    }).sort({ name: 1 });

    res.status(200).json(categories);
  } catch (error) {
    console.error("Fetch categories error:", error.message);

    res.status(500).json({
      message: "Failed to fetch categories.",
    });
  }
});

// POST a new category
router.post("/", authorize("admin", "inventory"), async (req, res) => {
  try {
    const { name, description = "" } = req.body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({
        message: "Category name is required.",
      });
    }

    const duplicateCategory = await Category.findOne({ name: name.trim() })
      .collation({ locale: "en", strength: 2 });
    if (duplicateCategory) {
      return res.status(409).json({
        message: "A category with this name already exists. Category names are not case-sensitive.",
      });
    }

    const category = await Category.create({
      name: name.trim(),
      description,
    });

    return res.status(201).json({
      message: "Category created successfully.",
      category,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "A category with this name already exists.",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: error.message,
      });
    }

    console.error("Create category error:", error.message);

    return res.status(500).json({
      message: "Failed to create category.",
    });
  }
});


// UPDATE an active category
router.put("/:id", authorize("admin", "inventory"), async (req, res) => {
  try {
    const mongoose = require("mongoose");
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid category ID." });
    const { name, description = "" } = req.body;
    if (!name || typeof name !== "string" || !name.trim()) return res.status(400).json({ message: "Category name is required." });

    const current = await Category.findOne({ _id: req.params.id, isArchived: { $ne: true } });
    if (!current) return res.status(404).json({ message: "Active category not found." });
    const duplicate = await Category.findOne({ _id: { $ne: req.params.id }, name: name.trim() }).collation({ locale: "en", strength: 2 });
    if (duplicate) return res.status(409).json({ message: "A category with this name already exists. Category names are not case-sensitive." });

    current.name = name.trim();
    current.description = typeof description === "string" ? description.trim() : "";
    await current.save();
    return res.status(200).json({ message: "Category updated successfully.", category: current });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: "A category with this name already exists." });
    if (error.name === "ValidationError") return res.status(400).json({ message: error.message });
    console.error("Update category error:", error.message);
    return res.status(500).json({ message: "Failed to update category." });
  }
});

/* ARCHIVE a category */
router.patch("/:id/archive", authorize("admin", "inventory"), async (req, res) => {
  try {
    const mongoose = require("mongoose");
    const Category = require("../models/Categories.cjs");

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid category ID." });
    }

    const category = await Category.findOneAndUpdate(
      { _id: req.params.id, isArchived: { $ne: true } },
      {
        $set: {
          isArchived: true,
          archivedAt: new Date(),
        },
      },
      { returnDocument: "after", runValidators: true }
    );

    if (!category) {
      return res.status(404).json({ message: "Active category not found." });
    }

    return res.status(200).json({
      message: "Category archived successfully.",
      category,
    });
  } catch (error) {
    console.error("Archive category error:", error.message);
    return res.status(500).json({ message: "Failed to archive category." });
  }
});

/* GET archived categories */
router.get("/archived", authorize("admin", "inventory"), async (req, res) => {
  try {
    const Category = require("../models/Categories.cjs");

    const categories = await Category.find({ isArchived: true }).sort({
      name: 1,
    });

    return res.status(200).json(categories);
  } catch (error) {
    console.error("Fetch archived categories error:", error.message);
    return res.status(500).json({
      message: "Failed to fetch archived categories.",
    });
  }
});

/* RESTORE a category */
router.patch("/:id/restore", authorize("admin", "inventory"), async (req, res) => {
  try {
    const mongoose = require("mongoose");
    const Category = require("../models/Categories.cjs");

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid category ID." });
    }

    const category = await Category.findOneAndUpdate(
      { _id: req.params.id, isArchived: true },
      {
        $set: {
          isArchived: false,
          archivedAt: null,
        },
      },
      { returnDocument: "after", runValidators: true }
    );

    if (!category) {
      return res.status(404).json({
        message: "Archived category not found.",
      });
    }

    return res.status(200).json({
      message: "Category restored successfully.",
      category,
    });
  } catch (error) {
    console.error("Restore category error:", error.message);
    return res.status(500).json({
      message: "Failed to restore category.",
    });
  }
});


module.exports = router;
