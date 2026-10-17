import { useEffect, useState } from "react";
import { getStockMovements } from "../services/stockMovementService";

// Loads the Stock Movement History list.
export function useStockMovements({ authUser, module }) {
  const [stockMovements, setStockMovements] = useState([]);
  const [movementLoading, setMovementLoading] = useState(false);
  const [movementError, setMovementError] = useState("");
  const [movementSearch, setMovementSearch] = useState("");

  useEffect(() => {
    if (!authUser || module !== "stock-movements") return;

    let cancelled = false;

    async function load() {
      setMovementLoading(true);
      setMovementError("");
      try {
        const data = await getStockMovements();
        if (!cancelled) setStockMovements(data);
      } catch (err) {
        if (!cancelled) {
          setMovementError(
            err.message || "Failed to load stock movement history.",
          );
        }
      } finally {
        if (!cancelled) setMovementLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [module, authUser]);

  // Called when the user switches to another screen.
  const resetFeedback = () => {
    setMovementError("");
  };

  return {
    stockMovements,
    setStockMovements,
    movementLoading,
    movementError,
    movementSearch,
    setMovementSearch,
    resetFeedback,
  };
}
