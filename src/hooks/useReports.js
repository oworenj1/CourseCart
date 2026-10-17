import { useEffect, useState } from "react";
import { getProducts } from "../services/productService";
import { getSales } from "../services/salesService";

// Loads the sales and product data used by Reports & Analytics.
export function useReports({ authUser, module }) {
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [reportStartDate, setReportStartDate] = useState("");
  const [reportEndDate, setReportEndDate] = useState("");
  const [salesLoading, setSalesLoading] = useState(false);
  const [salesError, setSalesError] = useState("");

  useEffect(() => {
    if (!authUser || module !== "reports") return;

    let cancelled = false;

    async function load() {
      setSalesLoading(true);
      setSalesError("");
      try {
        const [salesData, productData] = await Promise.all([
          getSales(),
          getProducts(),
        ]);
        if (!cancelled) {
          setSales(Array.isArray(salesData) ? salesData : []);
          setProducts(Array.isArray(productData) ? productData : []);
        }
      } catch (err) {
        if (!cancelled)
          setSalesError(err.message || "Failed to load report data.");
      } finally {
        if (!cancelled) setSalesLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [module, authUser]);

  const refreshReports = async () => {
    setSalesLoading(true);
    setSalesError("");
    try {
      const [salesData, productData] = await Promise.all([
        getSales(),
        getProducts(),
      ]);
      setSales(Array.isArray(salesData) ? salesData : []);
      setProducts(Array.isArray(productData) ? productData : []);
    } catch (err) {
      setSalesError(err.message || "Failed to refresh reports.");
    } finally {
      setSalesLoading(false);
    }
  };

  // Picking a new start date clears an end date that would now be earlier.
  const changeReportStartDate = (nextValue) => {
    setReportStartDate(nextValue);
    if (reportEndDate && nextValue && reportEndDate < nextValue)
      setReportEndDate("");
  };

  const clearReportDates = () => {
    setReportStartDate("");
    setReportEndDate("");
  };

  return {
    sales,
    products,
    reportStartDate,
    reportEndDate,
    setReportEndDate,
    salesLoading,
    salesError,
    refreshReports,
    changeReportStartDate,
    clearReportDates,
  };
}
