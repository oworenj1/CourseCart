import ReportDatePicker from "../components/ReportDatePicker";
import { buildSalesReport } from "../utils/reportCalculations";
import { downloadReportPdf } from "../utils/reportPdf";
import { reportPrintStyles } from "../utils/reportPrintStyles";
import { formatAmount } from "../utils/formatters";
import { useState } from "react";
import { DEFAULT_REORDER_LEVEL, isLowStock } from "../utils/stock";


// Reports screen combines pre-calculated sales metrics with paginated inventory tables.
function Reports({
  sales,
  products,
  reportStartDate,
  reportEndDate,
  setReportEndDate,
  changeReportStartDate,
  clearReportDates,
  refreshReports,
  salesLoading,
  salesError,
}) {

  
  // Keep calculations in a shared utility so the screen and PDF use matching totals.
  const report = buildSalesReport({
    sales,
    products,
    startDate: reportStartDate,
    endDate: reportEndDate,
  });
  const {
    filteredSales,
    revenue,
    discounts,
    unitsSold,
    rankedProducts,
    activeProducts,
    lowStock,
    totalStock,
  } = report;

  const [inventoryPage, setInventoryPage] = useState(1);
  const [bestSellingPage, setBestSellingPage] = useState(1);
  const inventoryPageSize = 10;
  const bestSellingPageSize = 10;

  const sortedInventory = activeProducts
    .slice()
    .sort((a, b) => Number(a.stock) - Number(b.stock));

  const totalInventoryPages = Math.max(
    1,
    Math.ceil(sortedInventory.length / inventoryPageSize)
  );

  const safeInventoryPage = Math.min(
    inventoryPage,
    totalInventoryPages
  );

  const paginatedInventory = sortedInventory.slice(
    (safeInventoryPage - 1) * inventoryPageSize,
    safeInventoryPage * inventoryPageSize
  );

  const totalBestSellingPages = Math.max(
    1,
    Math.ceil(rankedProducts.length / bestSellingPageSize)
  );

  const safeBestSellingPage = Math.min(
    bestSellingPage,
    totalBestSellingPages
  );

  const paginatedBestSelling = rankedProducts.slice(
    (safeBestSellingPage - 1) * bestSellingPageSize,
    safeBestSellingPage * bestSellingPageSize
  );

  // Confirm and export the same report object currently shown on screen.
  const handleExportPdf = () => {
    if (reportStartDate && reportEndDate && reportStartDate > reportEndDate) {
      window.alert("The start date must be on or before the end date.");
      return;
    }
    const confirmed = window.confirm(
      "Download the current Reports & Analytics summary as a PDF?",
    );
    if (!confirmed) return;
    downloadReportPdf({
      report,
      startDate: reportStartDate,
      endDate: reportEndDate,
    });
  };

  return (
    <section>
      <style>{reportPrintStyles}</style>
      <div className="panel-heading">
        <div>
          <h3>Reports & Analytics</h3>
          <p>
            Summaries are calculated from saved sales and current inventory
            records.
          </p>
        </div>
        <button
          type="button"
          className="secondary-button"
          onClick={refreshReports}
        >
          Refresh
        </button>
      </div>
      <div
        className="form-grid report-date-fields"
        style={{ marginBottom: 18 }}
      >
        <ReportDatePicker
          label="From date"
          value={reportStartDate}
          onChange={changeReportStartDate}
        />
        <ReportDatePicker
          label="To date"
          value={reportEndDate}
          min={reportStartDate}
          onChange={setReportEndDate}
        />
        <div
          style={{
            display: "flex",
            alignItems: "end",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            className="secondary-button"
            onClick={clearReportDates}
          >
            Clear Dates
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={handleExportPdf}
          >
            Export to PDF
          </button>
        </div>
      </div>
      {reportStartDate && reportEndDate && reportStartDate > reportEndDate && (
        <p className="category-error">
          The start date must be on or before the end date.
        </p>
      )}
      {salesError && <p className="category-error">{salesError}</p>}
      {salesLoading ? (
        <p className="feedback">Loading report data...</p>
      ) : (
        <>
          <div className="dashboard-stat-grid">
            <article className="dashboard-stat-card">
              <span>Total Sales</span>
              <strong>₱{formatAmount(revenue)}</strong>
              <small>Completed transactions in selected period</small>
            </article>
            <article className="dashboard-stat-card">
              <span>Transactions</span>
              <strong>{filteredSales.length}</strong>
              <small>Completed sales</small>
            </article>
            <article className="dashboard-stat-card">
              <span>Units Sold</span>
              <strong>{unitsSold}</strong>
              <small>Total quantity sold</small>
            </article>
            <article className="dashboard-stat-card">
              <span>Discounts</span>
              <strong>₱{formatAmount(discounts)}</strong>
              <small>Total discounts applied</small>
            </article>
          </div>
          {/* Best sellers reflect the selected sales dates; inventory below is current stock. */}
          <div className="receiving-panel" style={{ marginTop: 20 }}>
            <div className="panel-heading">
              <div>
                <h3>Best-Selling Products</h3>
                <p>Ranked by units sold within the selected period.</p>
              </div>
            </div>
            <div className="po-table-wrapper">
              <table className="po-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Units Sold</th>
                    <th>Sales Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedBestSelling.map((item) => (
                    <tr key={item.name}>
                      <td>{item.name}</td>
                      <td>{item.quantity}</td>
                      <td>₱{formatAmount(item.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!rankedProducts.length && (
                <p className="feedback">
                  No completed sales in this date range.
                </p>
              )}
            </div>

            {rankedProducts.length > 0 && (
              <div className="user-pagination">
                <span>
                  Showing{" "}
                  {(safeBestSellingPage - 1) * bestSellingPageSize + 1}
                  –
                  {Math.min(
                    safeBestSellingPage * bestSellingPageSize,
                    rankedProducts.length
                  )}{" "}
                  of {rankedProducts.length} products
                </span>

                <div className="user-pagination-buttons">
                  <button
                    type="button"
                    className="secondary-button"
                    disabled={safeBestSellingPage === 1}
                    onClick={() => setBestSellingPage((page) => page - 1)}
                  >
                    Previous
                  </button>

                  <span>
                    Page {safeBestSellingPage} of {totalBestSellingPages}
                  </span>

                  <button
                    type="button"
                    className="secondary-button"
                    disabled={safeBestSellingPage === totalBestSellingPages}
                    onClick={() => setBestSellingPage((page) => page + 1)}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
          <div className="receiving-panel" style={{ marginTop: 20 }}>
            <div className="panel-heading">
              <div>
                <h3>Current Inventory Report</h3>
                <p>
                  Current stock is shown regardless of the sales date filter.
                </p>
              </div>
            </div>
            <div className="dashboard-stat-grid">
              <article className="dashboard-stat-card">
                <span>Active Products</span>
                <strong>{activeProducts.length}</strong>
              </article>
              <article className="dashboard-stat-card">
                <span>Total Units in Stock</span>
                <strong>{totalStock}</strong>
              </article>
              <article className="dashboard-stat-card">
                <span>Low-Stock Products</span>
                <strong>{lowStock.length}</strong>
              </article>
            </div>
            
            <div className="po-table-wrapper">
              <table className="po-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Stock</th>
                    <th>Reorder Level</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedInventory.map((product) => {
                    const isLow = isLowStock(product);

                    return (
                      <tr key={product._id}>
                        <td>{product.name}</td>
                        <td>{product.category || "—"}</td>
                        <td>{product.stock}</td>
                        <td>{product.reorderLevel ?? DEFAULT_REORDER_LEVEL}</td>
                        <td>
                          <span className={`po-status ${isLow ? "pending" : "received"}`}>
                            {isLow ? "Low Stock" : "In Stock"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
    
           <div className="user-pagination">
              <span>
                Showing{" "}
                {sortedInventory.length === 0
                  ? 0
                  : (safeInventoryPage - 1) * inventoryPageSize + 1}
                –
                {Math.min(
                  safeInventoryPage * inventoryPageSize,
                  sortedInventory.length
                )}{" "}
                of {sortedInventory.length} products
              </span>

              <div className="user-pagination-buttons">
                <button
                  type="button"
                  className="secondary-button"
                  disabled={safeInventoryPage === 1}
                  onClick={() =>
                    setInventoryPage((page) => page - 1)
                  }
                >
                  Previous
                </button>

                <span>
                  Page {safeInventoryPage} of {totalInventoryPages}
                </span>

                <button
                  type="button"
                  className="secondary-button"
                  disabled={safeInventoryPage === totalInventoryPages}
                  onClick={() =>
                    setInventoryPage((page) => page + 1)
                  }
                >
                  Next
                </button>
              </div>
            </div>
            
          </div>
        </>
      )}
    </section>
  );
}

export default Reports;
