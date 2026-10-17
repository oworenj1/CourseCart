
const mongoose = require("mongoose");

const purchaseOrderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    productName: {
      type: String,
      required: true,
      trim: true,
    },
    quantityOrdered: {
      type: Number,
      required: true,
      min: 1,
    },
    quantityReceived: {
      type: Number,
      default: 0,
      min: 0,
    },
    unitCost: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);


const receiptRequestSchema = new mongoose.Schema(
  {
    requestId: { type: String, required: true, trim: true },
    itemIndex: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    status: { type: String, enum: ["pending", "completed", "failed"], default: "pending" },
    stockMovement: { type: mongoose.Schema.Types.ObjectId, ref: "StockMovement", default: null },
    createdAt: { type: Date, default: Date.now },
    completedAt: { type: Date, default: null },
  },
  { _id: false }
);

const purchaseOrderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
      required: true,
    },
    items: {
      type: [purchaseOrderItemSchema],
      required: true,
      validate: {
        validator: (items) => items.length > 0,
        message: "A purchase order must contain at least one item.",
      },
    },
    totalCost: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["pending", "partially_received", "received", "cancelled"],
      default: "pending",
    },
    orderedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      required: true,
    },
    receivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      default: null,
    },
    orderedAt: {
      type: Date,
      default: Date.now,
    },
    receivedAt: {
      type: Date,
      default: null,
    },
    // Embedded request records make retries idempotent without changing existing documents.
    receiptRequests: { type: [receiptRequestSchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PurchaseOrder", purchaseOrderSchema);
