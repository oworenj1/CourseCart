
const express = require("express");
const StockMovement = require("../models/StockMovements.cjs");
const { protect, authorize } = require("../middleware/authMiddleware.cjs");

const router = express.Router();

router.use(protect);


// GET STOCK MOVEMENT HISTORY
router.get("/", authorize("admin", "inventory"), async (req, res) => {
  try {
    const movements = await StockMovement.find()
      .populate("product", "name")
      .populate("performedBy")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json(movements);
  } catch (error) {
    console.error("Fetch stock movement history error:", error);
    return res.status(500).json({
      message: "Failed to fetch stock movement history.",
    });
  }
});

module.exports = router;
