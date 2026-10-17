
const express = require("express");
const mongoose = require("mongoose");

const Sale = require("../models/Sales.cjs");
const Product = require("../models/Products.cjs");
const StockMovement = require("../models/StockMovements.cjs");
const { protect, authorize } = require("../middleware/authMiddleware.cjs");

const router = express.Router();

router.use(protect);


// GET all completed sales
router.get("/", authorize("admin", "cashier"), async (req, res) => {
  try {
    const sales = await Sale.find()
      .populate("cashier")
      .populate("items.product")
      .sort({ createdAt: -1 });

    return res.json(sales);
  } catch (error) {
    console.error("Failed to retrieve sales:", error);
    return res.status(500).json({
      message: "Failed to retrieve sales.",
    });
  }
});

/**
 * Attempts to undo the database writes made by this checkout.
 *
 * IMPORTANT:
 * MongoDB standalone servers do not support multi-document transactions.
 * This is compensating rollback, not a truly atomic transaction. If any
 * compensation operation fails, the caller must flag the checkout for
 * manual reconciliation.
 */
async function rollbackCheckout({
  transactionNumber,
  saleId,
  deductedStock,
}) {
  const failures = [];

  // Remove any movement rows that may have been written before an error.
  try {
    await StockMovement.deleteMany({ reference: transactionNumber });
  } catch (error) {
    failures.push({
      operation: "delete_stock_movements",
      message: error.message,
    });
  }

  // Remove the sale if it was created.
  if (saleId) {
    try {
      await Sale.deleteOne({ _id: saleId });
    } catch (error) {
      failures.push({
        operation: "delete_sale",
        message: error.message,
      });
    }
  }

  // Restore only stock deductions that this request actually completed.
  for (const deduction of [...deductedStock].reverse()) {
    try {
      const result = await Product.updateOne(
        { _id: deduction.productId },
        { $inc: { stock: deduction.quantity } }
      );

      if (result.matchedCount !== 1) {
        failures.push({
          operation: "restore_stock",
          productId: deduction.productId,
          message: "Product was not found while restoring stock.",
        });
      }
    } catch (error) {
      failures.push({
        operation: "restore_stock",
        productId: deduction.productId,
        message: error.message,
      });
    }
  }

  return failures;
}

// COMPLETE A SALE
router.post("/checkout", authorize("admin", "cashier"), async (req, res) => {
  const {
  items,
  discount = 0,
  paymentMethod,
  amountPaid,
  } = req.body || {};

  const cashier = req.user.id;

  if (!mongoose.isValidObjectId(cashier)) {
    return res.status(400).json({
      message: "A valid cashier account is required.",
    });
  }

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      message: "Your cart is empty.",
    });
  }

  if (!["cash", "gcash", "card"].includes(paymentMethod)) {
    return res.status(400).json({
      message: "Select a valid payment method.",
    });
  }

  const numericDiscount = Number(discount);
  const numericAmountPaid = Number(amountPaid);

  if (
    !Number.isFinite(numericDiscount) ||
    numericDiscount < 0 ||
    !Number.isFinite(numericAmountPaid) ||
    numericAmountPaid < 0
  ) {
    return res.status(400).json({
      message: "Invalid discount or payment amount.",
    });
  }

  // Combine duplicate product IDs and reject unsafe quantities.
  const quantities = new Map();

  for (const item of items) {
    const quantity = Number(item?.quantity);

    if (
      !mongoose.isValidObjectId(item?.product) ||
      !Number.isSafeInteger(quantity) ||
      quantity < 1
    ) {
      return res.status(400).json({
        message: "Each cart item needs a valid product and quantity.",
      });
    }

    const id = String(item.product);
    const combinedQuantity = (quantities.get(id) || 0) + quantity;

    if (!Number.isSafeInteger(combinedQuantity)) {
      return res.status(400).json({
        message: "Cart quantity is too large.",
      });
    }

    quantities.set(id, combinedQuantity);
  }

  let subtotal = 0;
  const saleItems = [];
  const stockChanges = [];

  try {
    // Validate every product and calculate the total before changing stock.
    for (const [productId, quantity] of quantities) {
      const product = await Product.findById(productId);

      if (!product || product.isArchived) {
        return res.status(400).json({
          message: "A product is unavailable or archived.",
        });
      }

      const availableStock = Number(product.stock);
      const unitPrice = Number(product.price);

      if (!Number.isFinite(availableStock) || availableStock < quantity) {
        return res.status(400).json({
          message: `Insufficient stock for ${product.name}. Available: ${product.stock}.`,
        });
      }

      if (!Number.isFinite(unitPrice) || unitPrice < 0) {
        console.error("Invalid product price encountered:", productId);
        return res.status(400).json({
          message: `Invalid price for ${product.name}.`,
        });
      }

      const lineTotal = unitPrice * quantity;

      if (!Number.isFinite(lineTotal)) {
        return res.status(400).json({
          message: "Cart total is too large to process.",
        });
      }

      subtotal += lineTotal;

      if (!Number.isFinite(subtotal)) {
        return res.status(400).json({
          message: "Cart total is too large to process.",
        });
      }

      saleItems.push({
        product: product._id,
        productName: product.name,
        quantity,
        unitPrice,
        lineTotal,
      });

      stockChanges.push({
        productId: product._id,
        productName: product.name,
        quantity,
      });
    }

    if (numericDiscount > subtotal) {
      return res.status(400).json({
        message: "Discount cannot exceed the subtotal.",
      });
    }

    const total = Math.max(0, subtotal - numericDiscount);

    if (numericAmountPaid < total) {
      return res.status(400).json({
        message: "Payment is less than the total amount due.",
      });
    }

    const transactionNumber =
      `TXN-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;

    // Tracks only successful deductions, so rollback never restores stock
    // for a product that this request did not successfully decrement.
    const deductedStock = [];
    let sale = null;

    try {
      // Conditional atomic decrement protects against overselling when two
      // checkouts compete for the same product stock.
      for (const change of stockChanges) {
        const updatedProduct = await Product.findOneAndUpdate(
          {
            _id: change.productId,
            stock: { $gte: change.quantity },
            isArchived: { $ne: true },
          },
          { $inc: { stock: -change.quantity } },
            {
            returnDocument: "after",
            }
        );

        if (!updatedProduct) {
          const rollbackFailures = await rollbackCheckout({
            transactionNumber,
            saleId: null,
            deductedStock,
          });

          if (rollbackFailures.length > 0) {
            console.error("Checkout rollback needs reconciliation:", {
              transactionNumber,
              rollbackFailures,
            });

            return res.status(500).json({
              message:
                "Stock changed during checkout and automatic recovery was incomplete. Please contact an administrator before retrying.",
              transactionNumber,
              reconciliationRequired: true,
            });
          }

          return res.status(409).json({
            message:
              `Stock changed during checkout for ${change.productName}. Please refresh the cart and try again.`,
          });
        }

        // The returned document reflects the stock after this atomic update.
        deductedStock.push({
          productId: String(change.productId),
          quantity: change.quantity,
          previousStock: Number(updatedProduct.stock) + change.quantity,
          newStock: Number(updatedProduct.stock),
        });
      }

      sale = await Sale.create({
        transactionNumber,
        cashier,
        items: saleItems,
        subtotal,
        discount: numericDiscount,
        total,
        paymentMethod,
        amountPaid: numericAmountPaid,
        change: numericAmountPaid - total,
        status: "completed",
      });

      // Record movement values from the actual successful stock updates,
      // rather than from a potentially stale pre-checkout product read.
      for (const deduction of deductedStock) {
        const change = stockChanges.find(
          (item) => String(item.productId) === deduction.productId
        );

        await StockMovement.create({
          product: deduction.productId,
          movementType: "sale",
          quantity: deduction.quantity,
          previousStock: deduction.previousStock,
          newStock: deduction.newStock,
          reason: "Point-of-sale transaction",
          reference: transactionNumber,
          performedBy: cashier,
        });
      }

      const savedSale = await Sale.findById(sale._id)
        .populate("cashier")
        .populate("items.product");

      if (!savedSale) {
        throw new Error(
          "Sale was created but could not be retrieved after checkout."
        );
      }

      return res.status(201).json({
        message: "Sale completed successfully.",
        sale: savedSale,
      });
    } catch (error) {
      console.error("Checkout write failed:", error);

      const rollbackFailures = await rollbackCheckout({
        transactionNumber,
        saleId: sale?._id || null,
        deductedStock,
      });

      if (rollbackFailures.length > 0) {
        console.error("Checkout rollback needs manual reconciliation:", {
          transactionNumber,
          originalError: error.message,
          rollbackFailures,
        });

        return res.status(500).json({
          message:
            "Checkout failed and automatic recovery was incomplete. Please contact an administrator before retrying.",
          transactionNumber,
          reconciliationRequired: true,
        });
      }

      return res.status(500).json({
        message: "Checkout failed. No sale was completed, and stock recovery was successful.",
        transactionNumber,
      });
    }
  } catch (error) {
    console.error("Unexpected checkout error:", error);

    return res.status(500).json({
      message: "Checkout failed due to an unexpected server error.",
    });
  }
});

module.exports = router;
