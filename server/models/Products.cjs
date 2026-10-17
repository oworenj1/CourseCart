
const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    // Keep as a string for backward compatibility.
    category: {
      type: String,
      required: true,
      trim: true,
    },

    // Existing field: this is the selling price.
    price: {
      type: Number,
      required: true,
      min: 0,
    },

    // Current stock quantity.
    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    // Optional product code; existing products do not need one yet.
    sku: {
      type: String,
      trim: true,
      uppercase: true,
      sparse: true,
      unique: true,
    },

    // Optional purchase cost per unit.
    costPrice: {
      type: Number,
      min: 0,
    },

    // Low-stock warning threshold.
    reorderLevel: {
      type: Number,
      min: 0,
      default: 10,
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },

    isArchived: {
      type: Boolean,
      default: false,
    },

    archivedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Product", productSchema);
