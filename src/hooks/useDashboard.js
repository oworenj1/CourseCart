import { useEffect, useState } from "react";
import { getProducts } from "../services/productService";
import { getCategories } from "../services/categoryService";
import { getSuppliers } from "../services/supplierService";
import { getPurchaseOrders } from "../services/purchaseOrderService";
import { getStockMovements } from "../services/stockMovementService";
import { getSales } from "../services/salesService";

// Loads the numbers shown on the Dashboard (which ones depends on the user's role).
export function useDashboard({ authUser, module }) {
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState("");
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [stockMovements, setStockMovements] = useState([]);
  const [sales, setSales] = useState([]);

  // Fetch only the dashboard data this signed-in role is allowed to use.
  useEffect(() => {
    if (!authUser || module !== "dashboard") return;

    let cancelled = false;

    async function load() {
      setDashboardLoading(true);
      setDashboardError("");
      try {
        const role = authUser.role;
        const tasks = [getProducts()];
        if (role === "admin" || role === "inventory") {
          tasks.push(
            getCategories(),
            getSuppliers(),
            getPurchaseOrders(),
            getStockMovements(),
          );
        }
        if (role === "admin" || role === "cashier") tasks.push(getSales());
        // Run independent requests together, then map each result back to its state.
        const results = await Promise.all(tasks);
        if (!cancelled) {
          setProducts(Array.isArray(results[0]) ? results[0] : []);
          let index = 1;
          if (role === "admin" || role === "inventory") {
            setCategories(Array.isArray(results[index]) ? results[index] : []);
            index++;
            setSuppliers(Array.isArray(results[index]) ? results[index] : []);
            index++;
            setPurchaseOrders(
              Array.isArray(results[index]) ? results[index] : [],
            );
            index++;
            setStockMovements(
              Array.isArray(results[index]) ? results[index] : [],
            );
            index++;
          }
          if (role === "admin" || role === "cashier") {
            setSales(Array.isArray(results[index]) ? results[index] : []);
          }
        }
      } catch (err) {
        if (!cancelled)
          setDashboardError(err.message || "Unable to load dashboard data.");
      } finally {
        if (!cancelled) setDashboardLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [module, authUser]);

  return {
    dashboardLoading,
    dashboardError,
    products,
    categories,
    suppliers,
    purchaseOrders,
    stockMovements,
    sales,
  };
}
