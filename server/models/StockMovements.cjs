
const mongoose = require("mongoose");

const stockMovementSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    movementType: {
      type: String,
      required: true,
      enum: ["stock_in", "sale", "adjustment"],
    },

    // Always store a positive quantity; movementType determines its meaning.
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    previousStock: {
      type: Number,
      required: true,
      min: 0,
    },

    newStock: {
      type: Number,
      required: true,
      min: 0,
    },

    reason: {
      type: String,
      trim: true,
      default: "",
    },

    // Optional reference to a sale or purchase order.
    reference: {
      type: String,
      trim: true,
      default: "",
    },

    // Optional idempotency key for purchase-order receiving; old records remain valid.
    receiptRequestId: {
      type: String,
      trim: true,
      default: undefined,
    },

    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "StockMovement",
  stockMovementSchema
);
