
const express = require("express");
const Supplier = require("../models/Suppliers.cjs");
const { protect, authorize } = require("../middleware/authMiddleware.cjs");


const router = express.Router();

router.use(protect);


// GET all active suppliers
router.get("/", authorize("admin", "inventory"), async (req, res) => {
  try {
    const suppliers = await Supplier.find({
      isArchived: { $ne: true },
    }).sort({ name: 1 });

    return res.status(200).json(suppliers);
  } catch (error) {
    console.error("Fetch suppliers error:", error.message);

    return res.status(500).json({
      message: "Failed to fetch suppliers.",
    });
  }
});

// POST a new supplier
router.post("/", authorize("admin", "inventory"), async (req, res) => {
  try {
    const { name, contactPerson, phone, email, address } = req.body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({
        message: "Supplier name is required.",
      });
    }

    const duplicateSupplier = await Supplier.findOne({ name: name.trim() }).collation({ locale: "en", strength: 2 });
    if (duplicateSupplier) return res.status(409).json({ message: "A supplier with this name already exists. Supplier names are not case-sensitive." });

    const supplier = await Supplier.create({
      name: name.trim(),
      contactPerson,
      phone,
      email,
      address,
    });

    return res.status(201).json({
      message: "Supplier created successfully.",
      supplier,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: error.message,
      });
    }

    console.error("Create supplier error:", error.message);

    return res.status(500).json({
      message: "Failed to create supplier.",
    });
  }
});


// UPDATE an active supplier
router.put("/:id", authorize("admin", "inventory"), async (req, res) => {
  try {
    const mongoose = require("mongoose");
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid supplier ID." });
    const { name, contactPerson = "", phone = "", email = "", address = "" } = req.body;
    if (!name || typeof name !== "string" || !name.trim()) return res.status(400).json({ message: "Supplier name is required." });

    const current = await Supplier.findOne({ _id: req.params.id, isArchived: { $ne: true } });
    if (!current) return res.status(404).json({ message: "Active supplier not found." });
    const duplicate = await Supplier.findOne({ _id: { $ne: req.params.id }, name: name.trim() }).collation({ locale: "en", strength: 2 });
    if (duplicate) return res.status(409).json({ message: "A supplier with this name already exists. Supplier names are not case-sensitive." });

    current.name = name.trim();
    current.contactPerson = typeof contactPerson === "string" ? contactPerson.trim() : "";
    current.phone = typeof phone === "string" ? phone.trim() : "";
    current.email = typeof email === "string" ? email.trim().toLowerCase() : "";
    current.address = typeof address === "string" ? address.trim() : "";
    await current.save();
    return res.status(200).json({ message: "Supplier updated successfully.", supplier: current });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: "A supplier with this name already exists." });
    if (error.name === "ValidationError") return res.status(400).json({ message: error.message });
    console.error("Update supplier error:", error.message);
    return res.status(500).json({ message: "Failed to update supplier." });
  }
});

/* GET archived suppliers */
router.get("/archived", authorize("admin", "inventory"), async (req, res) => {
  try {
    const suppliers = await Supplier.find({
      isArchived: true,
    }).sort({ name: 1 });

    return res.status(200).json(suppliers);
  } catch (error) {
    console.error("Fetch archived suppliers error:", error.message);
    return res.status(500).json({
      message: "Failed to fetch archived suppliers.",
    });
  }
});

/* ARCHIVE supplier */
router.patch("/:id/archive", authorize("admin", "inventory"), async (req, res) => {
  try {
    const mongoose = require("mongoose");

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid supplier ID." });
    }

    const supplier = await Supplier.findOneAndUpdate(
      { _id: req.params.id, isArchived: { $ne: true } },
      {
        $set: {
          isArchived: true,
          archivedAt: new Date(),
        },
      },
      { returnDocument: "after", runValidators: true }
    );

    if (!supplier) {
      return res.status(404).json({
        message: "Active supplier not found.",
      });
    }

    return res.status(200).json({
      message: "Supplier archived successfully.",
      supplier,
    });
  } catch (error) {
    console.error("Archive supplier error:", error.message);
    return res.status(500).json({
      message: "Failed to archive supplier.",
    });
  }
});

/* RESTORE supplier */
router.patch("/:id/restore", authorize("admin", "inventory"), async (req, res) => {
  try {
    const mongoose = require("mongoose");

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid supplier ID." });
    }

    const supplier = await Supplier.findOneAndUpdate(
      { _id: req.params.id, isArchived: true },
      {
        $set: {
          isArchived: false,
          archivedAt: null,
        },
      },
      { returnDocument: "after", runValidators: true }
    );

    if (!supplier) {
      return res.status(404).json({
        message: "Archived supplier not found.",
      });
    }

    return res.status(200).json({
      message: "Supplier restored successfully.",
      supplier,
    });
  } catch (error) {
    console.error("Restore supplier error:", error.message);
    return res.status(500).json({
      message: "Failed to restore supplier.",
    });
  }
});


module.exports = router;
