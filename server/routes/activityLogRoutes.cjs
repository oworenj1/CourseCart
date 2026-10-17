const express = require("express");
const ActivityLog = require("../models/ActivityLogs.cjs");
const { protect, authorize } = require("../middleware/authMiddleware.cjs");

const router = express.Router();
router.use(protect, authorize("admin"));

// GET /api/activity-logs?limit=100&search=...
router.get("/", async (req, res) => {
  try {
    const requestedLimit = Number.parseInt(req.query.limit, 10);
    const limit = Number.isInteger(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 250) : 100;
    const filter = {};

    if (req.query.action) filter.action = String(req.query.action).slice(0, 100);
    if (req.query.entityType) {
      const allowedTypes = ["account", "category", "product", "supplier", "sale", "purchaseOrder", "stockMovement", "system"];
      if (!allowedTypes.includes(req.query.entityType)) {
        return res.status(400).json({ message: "Invalid activity entity type." });
      }
      filter.entityType = req.query.entityType;
    }

    const logs = await ActivityLog.find(filter)
      .populate("user", "firstName lastName email role")
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const search = String(req.query.search || "").trim().toLowerCase();
    const visibleLogs = search
      ? logs.filter((log) => {
          const user = log.user || {};
          const userName = [user.firstName, user.lastName, user.email, user.role].filter(Boolean).join(" ");
          return [log.action, log.entityType, log.details, userName].join(" ").toLowerCase().includes(search);
        })
      : logs;

    return res.json({ logs: visibleLogs });
  } catch (error) {
    console.error("Fetch activity logs error:", error.message);
    return res.status(500).json({ message: "Failed to load activity logs." });
  }
});

module.exports = router;
