import ReportDatePicker from "../components/ReportDatePicker";
import { buildSalesReport } from "../utils/reportCalculations";
import { downloadReportPdf } from "../utils/reportPdf";
import { reportPrintStyles } from "../utils/reportPrintStyles";
import { formatAmount } from "../utils/formatters";
import { DEFAULT_REORDER_LEVEL, isLowStock } from "../utils/stock";

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
                  {rankedProducts.map((item) => (
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
                  {activeProducts
                    .slice()
                    .sort((a, b) => Number(a.stock) - Number(b.stock))
                    .map((product) => {
                      const isLow = isLowStock(product);
                      return (
                        <tr key={product._id}>
                          <td>{product.name}</td>
                          <td>{product.category || "—"}</td>
                          <td>{product.stock}</td>
                          <td>
                            {product.reorderLevel ?? DEFAULT_REORDER_LEVEL}
                          </td>
                          <td>
                            <span
                              className={`po-status ${isLow ? "pending" : "received"}`}
                            >
                              {isLow ? "Low Stock" : "In Stock"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

export default Reports;
