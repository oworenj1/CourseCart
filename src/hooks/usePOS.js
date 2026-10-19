import { useCallback, useEffect, useState } from "react";
import { getProducts } from "../services/productService";
import { getStockMovements } from "../services/stockMovementService";
import { createSale } from "../services/salesService";

// Everything the Point of Sale screen needs: products, cart, and checkout.
// `setStockMovements` lets a finished sale refresh the stock movement list.
export function usePOS({ authUser, module, setStockMovements }) {
  const [posProducts, setPosProducts] = useState([]);
  const [posLoading, setPosLoading] = useState(false);
  const [posError, setPosError] = useState("");
  const [posSearch, setPosSearch] = useState("");
  const [cart, setCart] = useState([]);
  const [posDiscount, setPosDiscount] = useState("0");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [amountPaid, setAmountPaid] = useState("");
  const [checkoutSaving, setCheckoutSaving] = useState(false);
  const [completedSale, setCompletedSale] = useState(null);
  // Use the signed-in account for purchase orders, receiving, and checkout.
  const ORDERED_BY_ID = authUser?.id || "";

  useEffect(() => {
    if (!authUser || module !== "pos") return;

    let cancelled = false;

    async function load() {
      setPosLoading(true);
      setPosError("");
      try {
        const data = await getProducts();
        if (!cancelled)
          setPosProducts(
            Array.isArray(data) ? data.filter((p) => !p.isArchived) : [],
          );
      } catch (err) {
        if (!cancelled)
          setPosError(err.message || "Failed to load POS products.");
      } finally {
        if (!cancelled) setPosLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [module, authUser]);

  // POS helpers and checkout handlers
  const posFilteredProducts = posProducts.filter((product) =>
    `${product.name || ""} ${product.category || ""}`
      .toLowerCase()
      .includes(posSearch.trim().toLowerCase()),
  );

  const cartSubtotal = cart.reduce(
    (sum, item) => sum + Number(item.price) * Number(item.quantity),
    0,
  );
  const discountValue = Number(posDiscount) || 0;
  const cartTotal = Math.max(0, cartSubtotal - discountValue);
  const paymentValue = Number(amountPaid) || 0;
  const cartChange = Math.max(0, paymentValue - cartTotal);

  // Add one item at a time while preventing the cart quantity from exceeding stock.
  const addToCart = (product) => {
    setPosError("");
    setCompletedSale(null);
    setCart((previous) => {
      const existing = previous.find((item) => item._id === product._id);
      const currentQuantity = existing ? existing.quantity : 0;
      if (currentQuantity + 1 > Number(product.stock)) {
        setPosError(
          `Only ${product.stock} unit(s) of ${product.name} are available.`,
        );
        return previous;
      }
      if (existing) {
        return previous.map((item) =>
          item._id === product._id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      return [
        ...previous,
        {
          _id: product._id,
          name: product.name,
          price: Number(product.price),
          stock: Number(product.stock),
          quantity: 1,
        },
      ];
    });
  };

  const changeCartQuantity = (productId, value) => {
    const product = posProducts.find((item) => item._id === productId);
    const quantity = value === "" ? "" : Number(value);

    // Keep the user's current input so multi-digit values like 30 can be typed.
    setCart((previous) =>
      previous.map((item) =>
        item._id === productId ? { ...item, quantity } : item,
      ),
    );

    if (value === "") {
      setPosError("");
      return;
    }

    if (!Number.isInteger(quantity) || quantity < 1) {
      setPosError("Quantity must be a whole number greater than zero.");
      return;
    }

    if (product && quantity > Number(product.stock)) {
      setPosError(
        `Only ${product.stock} unit(s) are available for ${product.name}.`,
      );
      return;
    }

    setPosError("");
  };

  const handleCheckout = async (event) => {
    event.preventDefault();
    setPosError("");

    // Validate the cart, current product availability, discount, and payment before checkout.
    if (!cart.length) {
      setPosError("Add at least one product to the cart.");
      return;
    }
    for (const item of cart) {
      const quantity = Number(item.quantity);
      const product = posProducts.find((p) => p._id === item._id);

      if (!Number.isInteger(quantity) || quantity < 1) {
        setPosError(`Enter a valid whole-number quantity for ${item.name}.`);
        return;
      }

      if (!product || product.isArchived) {
        setPosError(
          `${item.name} is no longer available. Please refresh the POS.`,
        );
        return;
      }

      if (quantity > Number(product.stock)) {
        setPosError(
          `Only ${product.stock} unit(s) are available for ${item.name}.`,
        );
        return;
      }
    }

    if (
      !Number.isFinite(discountValue) ||
      discountValue < 0 ||
      discountValue > cartSubtotal
    ) {
      setPosError("Enter a valid discount that does not exceed the subtotal.");
      return;
    }
    if (!Number.isFinite(paymentValue) || paymentValue < cartTotal) {
      setPosError("Payment must be at least the total amount due.");
      return;
    }

    // The backend records the sale and adjusts inventory; refresh the screen from its responses.
    setCheckoutSaving(true);
    try {
      const result = await createSale({
        cashier: ORDERED_BY_ID,
        items: cart.map((item) => ({
          product: item._id,
          quantity: item.quantity,
        })),
        discount: discountValue,
        paymentMethod,
        amountPaid: paymentValue,
      });
      const sale = result.sale || result;
      setCompletedSale(sale);
      setCart([]);
      setPosDiscount("0");
      setAmountPaid("");
      const refreshed = await getProducts();
      setPosProducts(
        Array.isArray(refreshed) ? refreshed.filter((p) => !p.isArchived) : [],
      );
      // Refresh stock movement history if the user visits it next.
      try {
        const movements = await getStockMovements();
        setStockMovements(movements);
      } catch {
        // Checkout succeeded; history can be refreshed when its page is opened.
      }
    } catch (err) {
      setPosError(err.message || "Checkout failed.");
    } finally {
      setCheckoutSaving(false);
    }
  };

  const removeFromCart = (productId) => {
    setCart((old) => old.filter((x) => x._id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setPosError("");
    setCompletedSale(null);
  };

  const dismissReceipt = () => setCompletedSale(null);

  // Empties the cart and receipt (used when the user logs out).
  const resetSale = useCallback(() => {
    setCart([]);
    setCompletedSale(null);
  }, []);

  return {
    posProducts,
    posLoading,
    posError,
    posSearch,
    setPosSearch,
    posFilteredProducts,
    cart,
    cartSubtotal,
    cartTotal,
    cartChange,
    posDiscount,
    setPosDiscount,
    paymentMethod,
    setPaymentMethod,
    amountPaid,
    setAmountPaid,
    checkoutSaving,
    completedSale,
    addToCart,
    changeCartQuantity,
    removeFromCart,
    clearCart,
    dismissReceipt,
    handleCheckout,
    resetSale,
  };
}
