const express = require("express");
const Product = require("../models/Products.cjs");
const Category = require("../models/Categories.cjs");
const {
  protect,
  authorize,
} = require("../middleware/authMiddleware.cjs");
const router = express.Router();

// Require a valid login token for all product endpoints.
router.use(protect);

// GET all active products
router.get("/", authorize("admin", "cashier", "inventory"), async (req, res) => {
  try {
    const products = await Product.find({
      isArchived: { $ne: true },
      status: { $ne: "inactive" },
    }).sort({ name: 1 });

    return res.status(200).json(products);
  } catch (error) {
    console.error("Fetch products error:", error.message);

    return res.status(500).json({
      message: "Failed to fetch products.",
    });
  }
});

// POST a new product
router.post("/", authorize("admin", "inventory"), async (req, res) => {
  try {
    const { name, category, price, stock } = req.body;

    // Validate required text fields
    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof category !== "string" ||
      !category.trim()
    ) {
      return res.status(400).json({
        message: "Product name and category are required.",
      });
    }

    // Validate price
    if (
      price === undefined ||
      price === null ||
      price === "" ||
      !Number.isFinite(Number(price)) ||
      Number(price) < 0
    ) {
      return res.status(400).json({
        message: "Price must be a valid non-negative number.",
      });
    }

    // Validate stock (must be a whole number)
    if (
      stock !== undefined &&
      (
        stock === null ||
        stock === "" ||
        !Number.isInteger(Number(stock)) ||
        Number(stock) < 0
      )
    ) {
      return res.status(400).json({
        message: "Stock must be a non-negative whole number.",
      });
    }

    const duplicateProduct = await Product.findOne({ name: name.trim() })
      .collation({ locale: "en", strength: 2 });
    if (duplicateProduct) {
      return res.status(409).json({
        message: "A product with this name already exists. Product names are not case-sensitive.",
      });
    }

    const matchingCategory = await Category.findOne({
      name: category.trim(),
      isArchived: { $ne: true },
    }).collation({ locale: "en", strength: 2 });
    if (!matchingCategory) {
      return res.status(400).json({
        message: "Please select a valid active category from the Categories module.",
      });
    }

    const product = await Product.create({
      name: name.trim(),
      category: matchingCategory.name,
      price: Number(price),
      stock: stock === undefined ? 0 : Number(stock),
    });

    return res.status(201).json({
      message: "Product created successfully.",
      product,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: error.message,
      });
    }

    console.error("Create product error:", error.message);

    return res.status(500).json({
      message: "Failed to create product.",
    });
  }
});


/* UPDATE an existing product */
router.put("/:id", authorize("admin", "inventory"), async (req, res) => {
  try {
    const mongoose = require("mongoose");

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid product ID.",
      });
    }

    const { name, category, price } = req.body;

    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof category !== "string" ||
      !category.trim()
    ) {
      return res.status(400).json({
        message: "Product name and category are required.",
      });
    }

    if (
      price === undefined ||
      price === null ||
      price === "" ||
      !Number.isFinite(Number(price)) ||
      Number(price) < 0
    ) {
      return res.status(400).json({
        message: "Price must be a valid non-negative number.",
      });
    }

    const duplicateProduct = await Product.findOne({
      _id: { $ne: req.params.id },
      name: name.trim(),
    }).collation({ locale: "en", strength: 2 });
    if (duplicateProduct) {
      return res.status(409).json({
        message: "A product with this name already exists. Product names are not case-sensitive.",
      });
    }

    const matchingCategory = await Category.findOne({
      name: category.trim(),
      isArchived: { $ne: true },
    }).collation({ locale: "en", strength: 2 });
    if (!matchingCategory) {
      return res.status(400).json({
        message: "Please select a valid active category from the Categories module.",
      });
    }

    const product = await Product.findOneAndUpdate(
      {
        _id: req.params.id,
        isArchived: { $ne: true },
      },
      {
        $set: {
          name: name.trim(),
          category: matchingCategory.name,
          price: Number(price),
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!product) {
      return res.status(404).json({
        message: "Product not found.",
      });
    }

    return res.status(200).json({
      message: "Product updated successfully.",
      product,
    });
  } catch (error) {
    console.error("Update product error:", error.message);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Failed to update product.",
    });
  }
});


/* ARCHIVE an existing product */
router.patch("/:id/archive", authorize("admin", "inventory"), async (req, res) => {
  try {
    const mongoose = require("mongoose");
    const Product = require("../models/Products.cjs");

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid product ID.",
      });
    }

    const product = await Product.findOneAndUpdate(
      {
        _id: req.params.id,
        isArchived: { $ne: true },
      },
      {
        $set: {
          isArchived: true,
          archivedAt: new Date(),
        },
      },
      {
        returnDocument: "after",
        runValidators: true,
      }
    );

    if (!product) {
      return res.status(404).json({
        message: "Active product not found.",
      });
    }

    return res.status(200).json({
      message: "Product archived successfully.",
      product,
    });
  } catch (error) {
    console.error("Archive product error:", error.message);

    return res.status(500).json({
      message: "Failed to archive product.",
    });
  }
});


/* GET all archived products */
router.get("/archived", authorize("admin", "inventory"), async (req, res) => {
  try {
    const Product = require("../models/Products.cjs");

    const products = await Product.find({
      isArchived: true,
    }).sort({ name: 1 });

    return res.status(200).json(products);
  } catch (error) {
    console.error("Fetch archived products error:", error.message);

    return res.status(500).json({
      message: "Failed to fetch archived products.",
    });
  }
});

/* RESTORE an archived product */
router.patch("/:id/restore", authorize("admin", "inventory"), async (req, res) => {
  try {
    const mongoose = require("mongoose");
    const Product = require("../models/Products.cjs");

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid product ID.",
      });
    }

    const product = await Product.findOneAndUpdate(
      {
        _id: req.params.id,
        isArchived: true,
      },
      {
        $set: {
          isArchived: false,
          archivedAt: null,
        },
      },
      {
        returnDocument: "after",
        runValidators: true,
      }
    );

    if (!product) {
      return res.status(404).json({
        message: "Archived product not found.",
      });
    }

    return res.status(200).json({
      message: "Product restored successfully.",
      product,
    });
  } catch (error) {
    console.error("Restore product error:", error.message);

    return res.status(500).json({
      message: "Failed to restore product.",
    });
  }
});


module.exports = router;
