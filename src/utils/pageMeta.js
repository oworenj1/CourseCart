// Text shown in the page heading above the tabs.
// Note: "reports" and "pos" fall through to the defaults, exactly as before.
const TITLES = {
  dashboard: () => "Dashboard",
  "activity-logs": () => "Activity Logs",
  users: () => "User Management",
  products: ({ productView }) =>
    productView === "active" ? "Product Inventory" : "Archived Products",
  categories: ({ categoryView }) =>
    categoryView === "active" ? "Category Management" : "Archived Categories",
  suppliers: ({ supplierView }) =>
    supplierView === "active" ? "Supplier Management" : "Archived Suppliers",
  "purchase-orders": () => "Purchase Orders",
  "stock-movements": () => "Stock Movement History",
  sales: () => "Sales / Transaction History",
};

const SUBTITLES = {
  pos: "Select products, manage your cart, and complete a sale.",
  users: "Manage staff accounts, roles, and account access.",
  "activity-logs": "Review important actions recorded in CourseCart.",
  dashboard: "Your CourseCart workspace overview.",
};

const COUNT_LABELS = {
  "activity-logs": "Activities",
  users: "Accounts",
  products: "Products",
  categories: "Categories",
  suppliers: "Suppliers",
  "purchase-orders": "Purchase Orders",
  "stock-movements": "Movements",
  sales: "Transactions",
};

export const getPageHeading = (module, views, counts) => ({
  title: (TITLES[module] || (() => "Point of Sale"))(views),
  subtitle:
    SUBTITLES[module] ||
    "Manage products, categories, suppliers, purchase orders, and stock history.",
  countLabel: COUNT_LABELS[module] || "Products",
  count: module in counts ? counts[module] : counts.pos,
});
