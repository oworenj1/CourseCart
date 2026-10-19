import {
  House,
  Package,
  Tags,
  Truck,
  ClipboardList,
  ArrowLeftRight,
  ReceiptText,
  ChartNoAxesColumn,
  ShoppingCart,
  Users,
  History,
} from "lucide-react";

// Each role gets only the modules listed here; backend permissions still enforce access.
// Role-based sidebar navigation. Keep these permissions aligned with backend access rules.
const TABS_BY_ROLE = {
  admin: [
    "dashboard",
    "products",
    "categories",
    "suppliers",
    "purchase-orders",
    "stock-movements",
    "sales",
    "reports",
    "pos",
    "users",
    "activity-logs",
  ],
  cashier: ["dashboard", "products", "sales", "pos"],
  inventory: [
    "dashboard",
    "products",
    "categories",
    "suppliers",
    "purchase-orders",
    "stock-movements",
  ],
};

const TAB_LABELS = {
  dashboard: "Dashboard",
  products: "Products",
  categories: "Categories",
  suppliers: "Suppliers",
  "purchase-orders": "Purchasing & Receiving",
  "stock-movements": "Stock Movement History",
  sales: "Sales History",
  reports: "Reports",
  pos: "Point of Sale",
  users: "User Management",
  "activity-logs": "Activity Logs",
};

const TAB_ICONS = {
  dashboard: House,
  products: Package,
  categories: Tags,
  suppliers: Truck,
  "purchase-orders": ClipboardList,
  "stock-movements": ArrowLeftRight,
  sales: ReceiptText,
  reports: ChartNoAxesColumn,
  pos: ShoppingCart,
  users: Users,
  "activity-logs": History,
};

function NavTabs({ role, module, onSelect }) {
  // Unknown roles use the inventory navigation list as the current UI fallback.
  const tabs = TABS_BY_ROLE[role === "admin" || role === "cashier" ? role : "inventory"];

  return (
    <nav className="view-tabs sidebar-nav" aria-label="Main navigation">
      {/* The active module is highlighted, and clicking a tab asks App to switch screens. */}
      {tabs.map((item) => (
        <button
          key={item}
          type="button"
          className={`view-tab sidebar-nav-item ${module === item ? "selected" : ""}`}
          onClick={() => onSelect(item)}
          aria-current={module === item ? "page" : undefined}
          title={TAB_LABELS[item]}
        >
          <span className="nav-icon" aria-hidden="true">
            {(() => {
              const Icon = TAB_ICONS[item];

              return (
                <Icon
                  size={20}
                  strokeWidth={2}
                  className="sidebar-icon"
                  aria-hidden="true"
                />
              );
            })()}
        </span>
          <span className="nav-label">{TAB_LABELS[item]}</span>
        </button>
      ))}
    </nav>
  );
}

export default NavTabs;
