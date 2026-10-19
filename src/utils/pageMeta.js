
// Keep page labels separate from JSX so each module uses consistent heading text.
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
  reports: () => "Reports & Analytics",
  pos: () => "Point of Sale",
};

const SUBTITLES = {
  pos: "Select products, manage your cart, and complete a sale.",
  reports:
    "View sales performance, best-selling products, and current inventory reports.",
  users: "Manage staff accounts, roles, and account access.",
  "activity-logs": "Review important actions recorded in CourseCart.",
  dashboard: "Your CourseCart workspace overview.",
  products: "Manage your school supply inventory.",
  categories: "Organize products into categories.",
  suppliers: "Manage your suppliers and their contact information.",
  "purchase-orders": "Create purchase orders and manage stock receiving.",
  "stock-movements": "Track inventory stock movements and adjustments.",
  sales: "Review completed sales and transaction records.",
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
  reports: "Products",
  pos: "Products",
};

// Select the title, subtitle, and count label/value for the currently open module.
export const getPageHeading = (module, views, counts) => ({
  title: (TITLES[module] || (() => "Dashboard"))(views),
  subtitle: SUBTITLES[module] || "Welcome to your CourseCart workspace.",
  countLabel: COUNT_LABELS[module] || "Items",
  count: module in counts ? counts[module] : counts.pos,
});
