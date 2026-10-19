import { isLowStock } from "../utils/stock";

// Presents role-appropriate totals and shortcuts using data loaded by useDashboard.
function Dashboard({
  authUser,
  dashboardError,
  dashboardLoading,
  products,
  suppliers,
  purchaseOrders,
  sales,
  stockMovements,
  categories,
  switchModule,
}) {
  return (
    <section className="dashboard-overview">
      <div className="panel-heading">
        <div>
          <h3>Welcome, {authUser.firstName || "User"}!</h3>
          <p>Here's an overview of your CourseCart workspace.</p>
        </div>
        <button
          type="button"
          className="secondary-button"
          onClick={() => switchModule("products")}
        >
          View Products
        </button>
      </div>
      {dashboardError && <p className="category-error">{dashboardError}</p>}
      {dashboardLoading ? (
        <p className="feedback">Loading dashboard...</p>
      ) : (
        <>
          {/* Some totals are hidden from roles that do not use those modules. */}
          <div className="dashboard-stat-grid">
            <article className="dashboard-stat-card">
              <span>Products</span>
              <strong>{products.filter((p) => !p.isArchived).length}</strong>
              <small>Active product records</small>
            </article>
            <article className="dashboard-stat-card">
              <span>Low Stock Items</span>
              <strong>
                {products.filter((p) => !p.isArchived && isLowStock(p)).length}
              </strong>
              <small>At or below reorder level</small>
            </article>
            {(authUser.role === "admin" || authUser.role === "inventory") && (
              <article className="dashboard-stat-card">
                <span>Suppliers</span>
                <strong>{suppliers.filter((x) => !x.isArchived).length}</strong>
                <small>Registered suppliers</small>
              </article>
            )}
            {(authUser.role === "admin" || authUser.role === "inventory") && (
              <article className="dashboard-stat-card">
                <span>Purchase Orders</span>
                <strong>{purchaseOrders.length}</strong>
                <small>Recorded orders</small>
              </article>
            )}
            {(authUser.role === "admin" || authUser.role === "cashier") && (
              <article className="dashboard-stat-card">
                <span>Transactions</span>
                <strong>{sales.length}</strong>
                <small>Recorded sales</small>
              </article>
            )}
            {(authUser.role === "admin" || authUser.role === "inventory") && (
              <article className="dashboard-stat-card">
                <span>Stock Movements</span>
                <strong>{stockMovements.length}</strong>
                <small>Recorded stock changes</small>
              </article>
            )}
          </div>
          <div className="dashboard-lower-grid">
            <div className="receiving-panel">
              <h3>Quick Actions</h3>
              <p>Jump to the tasks you use most.</p>
              <div className="dashboard-actions">
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => switchModule("products")}
                >
                  Product Inventory
                </button>
                {(authUser.role === "admin" || authUser.role === "cashier") && (
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => switchModule("pos")}
                  >
                    Open POS
                  </button>
                )}
                {(authUser.role === "admin" ||
                  authUser.role === "inventory") && (
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => switchModule("purchase-orders")}
                  >
                    Purchase Orders
                  </button>
                )}
                {(authUser.role === "admin" || authUser.role === "cashier") && (
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => switchModule("sales")}
                  >
                    Sales / Transactions
                  </button>
                )}
              </div>
            </div>
            <div className="receiving-panel">
              <h3>Inventory Snapshot</h3>
              <p>Current active stock summary.</p>
              <div className="pos-total-row">
                <span>Total units in stock</span>
                <strong>
                  {products
                    .filter((p) => !p.isArchived)
                    .reduce((sum, p) => sum + (Number(p.stock) || 0), 0)}
                </strong>
              </div>
              <div className="pos-total-row">
                <span>Product categories</span>
                <strong>
                  {authUser.role === "cashier"
                    ? "—"
                    : categories.filter((c) => !c.isArchived).length}
                </strong>
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

export default Dashboard;
