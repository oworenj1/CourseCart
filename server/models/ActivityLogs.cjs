const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      default: null,
    },
    action: {
      type: String,
      required: true,
      trim: true,
    },
    entityType: {
      type: String,
      required: true,
      enum: [
        "account",
        "category",
        "product",
        "supplier",
        "sale",
        "purchaseOrder",
        "stockMovement",
        "system",
      ],
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    details: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Explicitly use the existing collection name shown in MongoDB Compass.
module.exports = mongoose.model(
  "ActivityLog",
  activityLogSchema,
  "activityLogs"
);
