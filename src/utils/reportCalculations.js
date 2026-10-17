import { isLowStock } from "./stock";

// Works out the product name shown for one line item of a sale.
export const getSaleItemName = (item) =>
  item.productName ||
  (item.product && typeof item.product === "object" ? item.product.name : "") ||
  "Product unavailable";

// Revenue for one sale line: the saved line total, or unit price x quantity.
const getLineRevenue = (item) =>
  Number(item.lineTotal) ||
  (Number(item.unitPrice) || 0) * (Number(item.quantity) || 0);

// Builds every number used by the Reports screen and the PDF export.
// Only completed sales inside the chosen date range are counted.
export const buildSalesReport = ({ sales, products, startDate, endDate }) => {
  const validRange = !startDate || !endDate || startDate <= endDate;

  const filteredSales = sales.filter((sale) => {
    if (sale.status && sale.status !== "completed") return false;
    const date = new Date(sale.createdAt || 0);
    if (Number.isNaN(date.getTime())) return false;
    const day = date.toLocaleDateString("en-CA");
    return (
      validRange &&
      (!startDate || day >= startDate) &&
      (!endDate || day <= endDate)
    );
  });

  const revenue = filteredSales.reduce(
    (sum, sale) => sum + (Number(sale.total) || 0),
    0,
  );
  const discounts = filteredSales.reduce(
    (sum, sale) => sum + (Number(sale.discount) || 0),
    0,
  );
  const unitsSold = filteredSales.reduce(
    (sum, sale) =>
      sum +
      (sale.items || []).reduce(
        (n, item) => n + (Number(item.quantity) || 0),
        0,
      ),
    0,
  );

  const bestSellers = {};
  filteredSales.forEach((sale) =>
    (sale.items || []).forEach((item) => {
      const name = getSaleItemName(item);
      if (!bestSellers[name])
        bestSellers[name] = { name, quantity: 0, revenue: 0 };
      bestSellers[name].quantity += Number(item.quantity) || 0;
      bestSellers[name].revenue += getLineRevenue(item);
    }),
  );
  const rankedProducts = Object.values(bestSellers).sort(
    (a, b) => b.quantity - a.quantity,
  );

  const activeProducts = products.filter((product) => !product.isArchived);
  const lowStock = activeProducts.filter(isLowStock);
  const totalStock = activeProducts.reduce(
    (sum, product) => sum + (Number(product.stock) || 0),
    0,
  );

  return {
    filteredSales,
    revenue,
    discounts,
    unitsSold,
    rankedProducts,
    activeProducts,
    lowStock,
    totalStock,
  };
};
