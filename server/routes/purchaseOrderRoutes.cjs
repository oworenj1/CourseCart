
const express = require("express");
const mongoose = require("mongoose");

const PurchaseOrder = require("../models/PurchaseOrders.cjs");
const Supplier = require("../models/Suppliers.cjs");
const Product = require("../models/Products.cjs");
const Account = require("../models/Accounts.cjs");
const StockMovement = require("../models/StockMovements.cjs");
const { protect, authorize } = require("../middleware/authMiddleware.cjs");

const router = express.Router();

router.use(protect);


// GET ALL PURCHASE ORDERS
router.get("/", authorize("admin", "inventory"), async (req, res) => {
  try {
    const orders = await PurchaseOrder.find().sort({ orderedAt: -1 });
    return res.status(200).json(orders);
  } catch (error) {
    console.error("Fetch purchase orders error:", error);
    return res.status(500).json({
      message: "Failed to fetch purchase orders.",
    });
  }
});

// GET ONE PURCHASE ORDER
router.get("/:id", authorize("admin", "inventory"), async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid purchase order ID." });
    }

    const order = await PurchaseOrder.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Purchase order not found." });
    }

    return res.status(200).json(order);
  } catch (error) {
    console.error("Fetch purchase order error:", error);
    return res.status(500).json({
      message: "Failed to fetch purchase order.",
    });
  }
});

// CREATE PURCHASE ORDER
router.post("/", authorize("admin", "inventory"), async (req, res) => {
  try {
    
        const { supplier: supplierId, items } = req.body;
        const orderedBy = req.user.id;


    if (
      !mongoose.isValidObjectId(supplierId) ||
      !mongoose.isValidObjectId(orderedBy)
    ) {
      return res.status(400).json({
        message: "A valid supplier ID and account ID are required.",
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: "Add at least one product to the purchase order.",
      });
    }

    const supplier = await Supplier.findById(supplierId);
    if (
      !supplier ||
      supplier.isArchived === true ||
      supplier.status !== "active"
    ) {
      return res.status(400).json({
        message: "Supplier not found, archived, or inactive.",
      });
    }

    const account = await Account.findById(orderedBy);
    if (!account) {
      return res.status(400).json({
        message: "The ordering account does not exist.",
      });
    }

    const preparedItems = [];
    const seenProducts = new Set();
    let totalCost = 0;

    for (const item of items) {
      const { product: productId, quantityOrdered, unitCost } = item;

      if (!mongoose.isValidObjectId(productId)) {
        return res.status(400).json({
          message: "One or more product IDs are invalid.",
        });
      }

      if (seenProducts.has(String(productId))) {
        return res.status(400).json({
          message: "Each product can appear only once per purchase order.",
        });
      }
      seenProducts.add(String(productId));

      const quantity = Number(quantityOrdered);
      const cost = Number(unitCost);

      if (!Number.isInteger(quantity) || quantity < 1) {
        return res.status(400).json({
          message: "Quantities must be whole numbers greater than zero.",
        });
      }

      if (
        unitCost === undefined ||
        unitCost === null ||
        unitCost === "" ||
        !Number.isFinite(cost) ||
        cost < 0
      ) {
        return res.status(400).json({
          message: "Each product must have a valid unit cost.",
        });
      }

      const product = await Product.findById(productId);

      if (!product || product.isArchived === true) {
        return res.status(400).json({
          message: "A product was not found or is archived.",
        });
      }

      preparedItems.push({
        product: product._id,
        productName: product.name,
        quantityOrdered: quantity,
        quantityReceived: 0,
        unitCost: cost,
      });

      totalCost += quantity * cost;
    }

    const order = await PurchaseOrder.create({
      orderNumber: `PO-${Date.now()}`,
      supplier: supplier._id,
      items: preparedItems,
      totalCost: Number(totalCost.toFixed(2)),
      status: "pending",
      orderedBy: account._id,
    });

    return res.status(201).json({
      message: "Purchase order created successfully.",
      order,
    });
  } catch (error) {
    console.error("Create purchase order error:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }

    if (error.code === 11000) {
      return res.status(409).json({
        message: "Purchase order number already exists. Please try again.",
      });
    }

    return res.status(500).json({
      message: "Failed to create purchase order.",
      error: error.message,
    });
  }
});

// RECEIVE STOCK FOR ONE PURCHASE ORDER ITEM
router.post("/:id/receive", authorize("admin", "inventory"), async (req, res) => {
  let stockUpdated = false;
  let orderUpdated = false;
  let movementCreated = false;

  let productId;
  let receiveQuantity;
  let previousStock;
  let newStock;
  let orderId;
  let itemIndex;
  let performedBy;
  let movementId;
  let previousOrderStatus;
  let previousReceivedBy;
  let previousReceivedAt;
  let previousItemReceived;
  let receiptRequestId;
  let receiptRequestReserved = false;

  try {
    
      orderId = req.params.id;
      itemIndex = Number(req.body.itemIndex);
      receiveQuantity = Number(req.body.quantity);
      performedBy = req.user.id;
      receiptRequestId = String(req.body.receiptRequestId || "").trim();

    if (!receiptRequestId || receiptRequestId.length > 120) {
      return res.status(400).json({ message: "A valid receipt request ID is required. Refresh the page and retry." });
    }

    if (!mongoose.isValidObjectId(orderId)) {
      return res.status(400).json({
        message: "Invalid purchase order ID.",
      });
    }

    
    if (
      !Number.isInteger(itemIndex) ||
      itemIndex < 0 ||
      !Number.isInteger(receiveQuantity) ||
      receiveQuantity < 1
    ) {

      return res.status(400).json({
        message:
          "A valid item index, positive whole-number quantity, and account ID are required.",
      });
    }

    const account = await Account.findById(performedBy);

        if (!account || account.status !== "active" || account.isArchived) {
            return res.status(400).json({
            message: "The receiving account does not exist or is inactive.",
        });
    }

    const order = await PurchaseOrder.findById(orderId);

    if (!order) {
      return res.status(404).json({
        message: "Purchase order not found.",
      });
    }

    // If this exact receiving action already completed, return its result rather
    // than adding the quantity again after a timeout or lost response.
    const existingReceipt = (order.receiptRequests || []).find(
      (entry) => entry.requestId === receiptRequestId
    );
    if (existingReceipt?.status === "completed") {
      const savedMovement = existingReceipt.stockMovement
        ? await StockMovement.findById(existingReceipt.stockMovement)
        : null;
      if (!savedMovement) {
        return res.status(409).json({
          message: "This receipt was already processed, but its movement record could not be found. Refresh and review inventory history before retrying.",
          receiptAlreadyProcessed: true,
        });
      }
      const latestOrder = await PurchaseOrder.findById(orderId);
      return res.status(200).json({
        message: "This receipt was already processed. No additional stock was added.",
        order: latestOrder,
        stockMovement: savedMovement,
        replayed: true,
      });
    }
    if (existingReceipt?.status === "pending") {
      return res.status(409).json({
        message: "This receipt request is already being processed. Refresh the purchase order before trying again.",
        receiptPending: true,
      });
    }

    if (order.status === "cancelled") {
      return res.status(400).json({
        message: "Cancelled purchase orders cannot receive stock.",
      });
    }

    // Snapshot the order metadata before making any changes so rollback can
    // restore it if a later operation fails after the finalization write.
    previousOrderStatus = order.status;
    previousReceivedBy = order.receivedBy ?? null;
    previousReceivedAt = order.receivedAt ?? null;

    const item = order.items[itemIndex];

    if (!item) {
      return res.status(400).json({
        message: "Purchase order item not found.",
      });
    }

    if (receiveQuantity > item.quantityOrdered - item.quantityReceived) {
      return res.status(400).json({
        message: "Received quantity cannot exceed the outstanding quantity.",
        remaining:
          item.quantityOrdered - item.quantityReceived,
      });
    }

    previousItemReceived = item.quantityReceived;
    productId = item.product;
    const product = await Product.findById(productId);

    if (!product || product.isArchived) {
      return res.status(400).json({
        message: "The product does not exist or is archived.",
      });
    }

    // Reserve this request ID atomically on the purchase order. This uses an
    // embedded field (no new unique index or database reset required).
    if (existingReceipt?.status === "failed") {
      const retryReservation = await PurchaseOrder.updateOne(
        { _id: orderId, receiptRequests: { $elemMatch: { requestId: receiptRequestId, status: "failed" } } },
        { $set: { "receiptRequests.$.status": "pending", "receiptRequests.$.itemIndex": itemIndex, "receiptRequests.$.quantity": receiveQuantity, "receiptRequests.$.stockMovement": null, "receiptRequests.$.completedAt": null } }
      );
      if (retryReservation.modifiedCount !== 1) {
        return res.status(409).json({ message: "This receipt request changed. Refresh and retry." });
      }
      receiptRequestReserved = true;
    } else {
      const reservation = await PurchaseOrder.updateOne(
        { _id: orderId, "receiptRequests.requestId": { $ne: receiptRequestId } },
        { $push: { receiptRequests: { requestId: receiptRequestId, itemIndex, quantity: receiveQuantity, status: "pending" } } }
      );
      if (reservation.modifiedCount !== 1) {
        const latest = await PurchaseOrder.findById(orderId);
        const current = (latest?.receiptRequests || []).find((entry) => entry.requestId === receiptRequestId);
        if (current?.status === "completed") {
          const savedMovement = current.stockMovement ? await StockMovement.findById(current.stockMovement) : null;
          return res.status(200).json({ message: "This receipt was already processed. No additional stock was added.", order: latest, stockMovement: savedMovement, replayed: true });
        }
        return res.status(409).json({ message: "This receipt request is already being processed. Refresh and check the purchase order." });
      }
      receiptRequestReserved = true;
    }

    previousStock = product.stock;
    newStock = previousStock + receiveQuantity;

    // Atomically reserve this receiving quantity on the PO item.
    // This prevents two simultaneous requests from receiving the
    // same remaining quantity.
    const quantityPath = `items.${itemIndex}.quantityReceived`;

    const updatedOrder = await PurchaseOrder.findOneAndUpdate(
      {
        _id: orderId,
        status: { $ne: "cancelled" },
        [quantityPath]: {
          $lte: item.quantityOrdered - receiveQuantity,
        },
      },
      {
        $inc: { [quantityPath]: receiveQuantity },
      },
      { returnDocument: "after", runValidators: true }
    );

    if (!updatedOrder) {
      await PurchaseOrder.updateOne(
        { _id: orderId, receiptRequests: { $elemMatch: { requestId: receiptRequestId, status: "pending" } } },
        { $set: { "receiptRequests.$.status": "failed" } }
      );
      return res.status(409).json({
        message:
          "The order changed while receiving stock. Refresh and try again.",
      });
    }

    orderUpdated = true;

    // Atomically increase product stock.
    const updatedProduct = await Product.findOneAndUpdate(
      {
        _id: productId,
        isArchived: { $ne: true },
        stock: previousStock,
      },
      { $inc: { stock: receiveQuantity } },
      { returnDocument: "after", runValidators: true }
    );

    if (!updatedProduct) {
      throw new Error(
        "Product stock changed during receiving. The operation will be rolled back."
      );
    }

    stockUpdated = true;
    newStock = updatedProduct.stock;

    // Record the stock movement.
    const movement = await StockMovement.create({
      product: productId,
      movementType: "stock_in",
      quantity: receiveQuantity,
      previousStock,
      newStock,
      reason: "Purchase order stock received",
      reference: order.orderNumber,
      receiptRequestId,
      performedBy: account._id,
    });

    movementId = movement._id;
    movementCreated = true;

    // Recalculate status from the latest persisted order.
    const allReceived = updatedOrder.items.every(
      (poItem) =>
        poItem.quantityReceived >= poItem.quantityOrdered
    );

    const anyReceived = updatedOrder.items.some(
      (poItem) => poItem.quantityReceived > 0
    );

    const nextStatus = allReceived
      ? "received"
      : anyReceived
        ? "partially_received"
        : "pending";

    const finalOrder = await PurchaseOrder.findOneAndUpdate(
      {
        _id: orderId,
        status: { $ne: "cancelled" },
      },
      {
        $set: {
          status: nextStatus,
          receivedBy: account._id,
          receivedAt: allReceived ? new Date() : null,
        },
      },
      { returnDocument: "after", runValidators: true }
    );

    if (!finalOrder) {
      throw new Error("Could not finalize the purchase order.");
    }

    const receiptCompleted = await PurchaseOrder.updateOne(
      { _id: orderId, receiptRequests: { $elemMatch: { requestId: receiptRequestId, status: "pending" } } },
      { $set: { "receiptRequests.$.status": "completed", "receiptRequests.$.stockMovement": movement._id, "receiptRequests.$.completedAt": new Date() } }
    );
    if (receiptCompleted.modifiedCount !== 1) {
      throw new Error("Could not finalize the receipt request record.");
    }

    const responseOrder = await PurchaseOrder.findById(orderId);
    return res.status(200).json({
      message: "Stock received successfully.",
      order: responseOrder,
      stockMovement: movement,
      replayed: false,
    });
  } catch (error) {
    console.error("Receive stock error:", error);

    // Best-effort compensation. Each step is isolated so a failure in one
    // rollback action does not prevent the remaining actions from running.
    const rollbackFailures = [];

    const recordRollbackFailure = (step, failure) => {
      const detail = {
        step,
        message: failure?.message || String(failure),
      };
      rollbackFailures.push(detail);
      console.error(`Stock receiving rollback failed (${step}):`, failure);
    };

    if (movementCreated && movementId) {
      try {
        const deletedMovement = await StockMovement.findByIdAndDelete(movementId);
        if (!deletedMovement) {
          recordRollbackFailure(
            "delete_stock_movement",
            new Error("Stock movement was not found during rollback.")
          );
        }
      } catch (failure) {
        recordRollbackFailure("delete_stock_movement", failure);
      }
    }

    if (stockUpdated) {
      try {
        // The stock equality guard avoids subtracting our quantity if another
        // operation has changed this product since our update.
        const rollbackProduct = await Product.updateOne(
          { _id: productId, stock: newStock },
          { $inc: { stock: -receiveQuantity } }
        );

        if (rollbackProduct.modifiedCount !== 1) {
          recordRollbackFailure(
            "restore_product_stock",
            new Error(
              "Product stock no longer matches the expected value; manual reconciliation is required."
            )
          );
        }
      } catch (failure) {
        recordRollbackFailure("restore_product_stock", failure);
      }
    }

    if (orderUpdated) {
      try {
        const rollbackOrder = await PurchaseOrder.updateOne(
          {
            _id: orderId,
            // Only reverse this request's increment if the item still has the
            // exact quantity we expect. This avoids undoing another receipt.
            [`items.${itemIndex}.quantityReceived`]:
              previousItemReceived + receiveQuantity,
          },
          {
            $inc: {
              [`items.${itemIndex}.quantityReceived`]: -receiveQuantity,
            },
            $set: {
              status: previousOrderStatus,
              receivedBy: previousReceivedBy,
              receivedAt: previousReceivedAt,
            },
          }
        );

        if (rollbackOrder.modifiedCount !== 1) {
          recordRollbackFailure(
            "restore_purchase_order_quantity",
            new Error(
              "Could not safely restore the purchase order received quantity."
            )
          );
        }
      } catch (failure) {
        recordRollbackFailure("restore_purchase_order_quantity", failure);
      }
    }

    if (receiptRequestReserved && receiptRequestId) {
      try {
        await PurchaseOrder.updateOne(
          { _id: orderId, receiptRequests: { $elemMatch: { requestId: receiptRequestId, status: "pending" } } },
          { $set: { "receiptRequests.$.status": "failed" } }
        );
      } catch (failure) {
        recordRollbackFailure("mark_receipt_request_failed", failure);
      }
    }

    const reconciliationRequired = rollbackFailures.length > 0;

    return res.status(500).json({
      message: reconciliationRequired
        ? "Stock receiving failed and automatic rollback was incomplete. Check inventory, purchase order quantities, and stock movement records before retrying."
        : "Stock receiving failed. The operation was rolled back where possible.",
      error: error.message,
      rollbackError: reconciliationRequired
        ? rollbackFailures.map((failure) => `${failure.step}: ${failure.message}`).join("; ")
        : null,
      reconciliationRequired,
      rollbackFailures,
    });
  }});

module.exports = router;
