import { useEffect, useState } from "react";
import { getSales } from "../services/salesService";

// Loads the Sales / Transaction History list.
export function useSales({ authUser, module }) {
  const [sales, setSales] = useState([]);
  const [salesLoading, setSalesLoading] = useState(false);
  const [salesError, setSalesError] = useState("");
  const [salesSearch, setSalesSearch] = useState("");
  const [selectedSale, setSelectedSale] = useState(null);

  useEffect(() => {
    if (!authUser || module !== "sales") return;

    let cancelled = false;

    async function load() {
      setSalesLoading(true);
      setSalesError("");
      try {
        const data = await getSales();
        if (!cancelled) setSales(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!cancelled)
          setSalesError(err.message || "Failed to load sales history.");
      } finally {
        if (!cancelled) setSalesLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [module, authUser]);

  const refreshSales = async () => {
    setSalesLoading(true);
    setSalesError("");
    try {
      const data = await getSales();
      setSales(Array.isArray(data) ? data : []);
    } catch (err) {
      setSalesError(err.message || "Failed to refresh sales history.");
    } finally {
      setSalesLoading(false);
    }
  };

  return {
    sales,
    salesLoading,
    salesError,
    salesSearch,
    setSalesSearch,
    selectedSale,
    setSelectedSale,
    refreshSales,
  };
}
