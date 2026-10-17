import { useEffect, useMemo, useState } from "react";
import SaleDetails from "../components/SaleDetails";
import { formatAmount } from "../utils/formatters";

const PAGE_SIZE_OPTIONS = [10, 25, 50];


function getCashierName(sale) {
  const cashier = sale.cashier;

  if (cashier && typeof cashier === "object") {
    return (
      [cashier.firstName, cashier.lastName].filter(Boolean).join(" ") ||
      cashier.name ||
      cashier.username ||
      cashier.email ||
      "Account recorded"
    );
  }

  return "Account unavailable";
}

function getCashierRole(sale) {
  const cashier = sale.cashier;

  if (cashier && typeof cashier === "object" && cashier.role) {
    const role =
      typeof cashier.role === "object"
        ? cashier.role.name || cashier.role.roleName
        : cashier.role;

    if (role) {
      return String(role)
        .replace(/[_-]+/g, " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
    }
  }

  return "";
}


function normalize(value) {
  return String(value || "").toLowerCase().replace(/[_-]+/g, " ").trim();
}

function Sales({
  sales = [],
  salesSearch,
  setSalesSearch,
  salesError,
  salesLoading,
  refreshSales,
  selectedSale,
  setSelectedSale,
}) {
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const paymentOptions = useMemo(() => Array.from(new Set(
    sales.map((sale) => normalize(sale.paymentMethod)).filter(Boolean),
  )).sort(), [sales]);
  const statusOptions = useMemo(() => Array.from(new Set(
    sales.map((sale) => normalize(sale.status || "completed")).filter(Boolean),
  )).sort(), [sales]);

  const filteredSales = useMemo(() => {
    const query = String(salesSearch || "").trim().toLowerCase();
    return sales.filter((sale) => {
      const searchable = [
        sale.transactionNumber,
        getCashierName(sale),
        sale.paymentMethod,
        sale.status || "completed",
        ...(sale.items || []).flatMap((item) => [item.name, item.productName, item.sku]),
      ].join(" ").toLowerCase();
      if (query && !searchable.includes(query)) return false;

      if (paymentFilter !== "all" && normalize(sale.paymentMethod) !== paymentFilter) return false;
      if (statusFilter !== "all" && normalize(sale.status || "completed") !== statusFilter) return false;

      if (startDate || endDate) {
        if (!sale.createdAt) return false;
        const saleDate = new Date(sale.createdAt);
        if (Number.isNaN(saleDate.getTime())) return false;
        if (startDate && saleDate < new Date(`${startDate}T00:00:00`)) return false;
        if (endDate && saleDate > new Date(`${endDate}T23:59:59.999`)) return false;
      }
      return true;
    }).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [sales, salesSearch, paymentFilter, statusFilter, startDate, endDate]);

  const totalPages = Math.max(1, Math.ceil(filteredSales.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const pageSales = filteredSales.slice((safePage - 1) * pageSize, safePage * pageSize);
  const firstItem = filteredSales.length ? (safePage - 1) * pageSize + 1 : 0;
  const lastItem = Math.min(safePage * pageSize, filteredSales.length);

  useEffect(() => {
    setCurrentPage(1);
  }, [salesSearch, paymentFilter, statusFilter, startDate, endDate, pageSize]);

  const clearFilters = () => {
    setSalesSearch("");
    setPaymentFilter("all");
    setStatusFilter("all");
    setStartDate("");
    setEndDate("");
    setCurrentPage(1);
  };

  return (
    <>
      <div className="panel-heading">
        <div>
          <h3>Sales / Transaction History</h3>
          <p>Review completed POS transactions and payment details.</p>
        </div>
        <div className="sales-heading-actions">
          <button type="button" className="secondary-button" onClick={clearFilters}>
            Clear Filters
          </button>
          <button type="button" className="secondary-button" onClick={refreshSales} disabled={salesLoading}>
            {salesLoading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      <div className="sales-filters">
        <div className="movement-search-field">
          <label htmlFor="sales-history-search">Search</label>
          <input
            id="sales-history-search"
            type="search"
            value={salesSearch || ""}
            onChange={(event) => setSalesSearch(event.target.value)}
            placeholder="Search transaction number, cashier, payment, or item..."
          />
        </div>
        <div className="movement-filter-field">
          <label htmlFor="sales-payment-filter">Payment method</label>
          <select id="sales-payment-filter" value={paymentFilter} onChange={(event) => setPaymentFilter(event.target.value)}>
            <option value="all">All payment methods</option>
            {paymentOptions.map((method) => <option key={method} value={method}>{method.replace(/\b\w/g, (letter) => letter.toUpperCase())}</option>)}
          </select>
        </div>
        <div className="movement-filter-field">
          <label htmlFor="sales-status-filter">Status</label>
          <select id="sales-status-filter" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="all">All statuses</option>
            {statusOptions.map((status) => <option key={status} value={status}>{status.replace(/\b\w/g, (letter) => letter.toUpperCase())}</option>)}
          </select>
        </div>
        <div className="movement-filter-field">
          <label htmlFor="sales-start-date">From date</label>
          <input id="sales-start-date" type="date" value={startDate} max={endDate || undefined} onChange={(event) => setStartDate(event.target.value)} />
        </div>
        <div className="movement-filter-field">
          <label htmlFor="sales-end-date">To date</label>
          <input id="sales-end-date" type="date" value={endDate} min={startDate || undefined} onChange={(event) => setEndDate(event.target.value)} />
        </div>
      </div>

      {salesError && <p className="category-error">{salesError}</p>}
      {salesLoading && <p className="feedback">Loading sales history...</p>}
      {!salesLoading && !salesError && (
        <>
          <div className="po-table-wrapper">
            <table className="po-table">
              <thead>
                <tr>
                  <th>Date</th><th>Transaction Number</th><th>Cashier</th><th>Items</th>
                  <th>Total</th><th>Payment</th><th>Status</th><th>Details</th>
                </tr>
              </thead>
              <tbody>
                {pageSales.map((sale) => {
                  const itemCount = (sale.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0);
                  const status = sale.status || "completed";
                  return (
                    <tr key={sale._id || sale.transactionNumber}>
                      <td>{sale.createdAt ? new Date(sale.createdAt).toLocaleString() : "—"}</td>
                      <td>{sale.transactionNumber || "—"}</td>
                      
                      <td>
                        {getCashierName(sale)}
                        {getCashierRole(sale) && (
                          <span className="sales-cashier-role">
                            {" "}({getCashierRole(sale)})
                          </span>
                        )}
                      </td>

                      <td>{itemCount} unit(s)</td>
                      <td>₱{formatAmount(sale.total)}</td>
                      <td>{String(sale.paymentMethod || "—").toUpperCase()}</td>
                      <td><span className={`po-status ${normalize(status).replace(/\s+/g, "-")}`}>{status}</span></td>
                      <td><button type="button" className="secondary-button" onClick={() => setSelectedSale(sale)}>View</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredSales.length === 0 && (
              <p className="feedback">{sales.length === 0 ? "No sales transactions have been recorded yet." : "No matching transactions found."}</p>
            )}
          </div>

          <div className="movement-pagination">
            <div className="movement-page-summary">Showing {firstItem}–{lastItem} of {filteredSales.length} transactions</div>
            <div className="movement-page-controls">
              <label htmlFor="sales-page-size">Rows per page</label>
              <select id="sales-page-size" value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))}>
                {PAGE_SIZE_OPTIONS.map((size) => <option key={size} value={size}>{size}</option>)}
              </select>
              <button type="button" className="secondary-button" onClick={() => setCurrentPage(1)} disabled={safePage === 1}>First</button>
              <button type="button" className="secondary-button" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={safePage === 1}>Previous</button>
              <span className="movement-page-number">Page {safePage} of {totalPages}</span>
              <button type="button" className="secondary-button" onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} disabled={safePage === totalPages}>Next</button>
              <button type="button" className="secondary-button" onClick={() => setCurrentPage(totalPages)} disabled={safePage === totalPages}>Last</button>
            </div>
          </div>
        </>
      )}
      {selectedSale && <SaleDetails selectedSale={selectedSale} onClose={() => setSelectedSale(null)} />}
    </>
  );
}

export default Sales;
