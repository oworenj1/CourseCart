import { useEffect, useMemo, useState } from "react";

const PAGE_SIZE_OPTIONS = [10, 25, 50];

// Read-only stock audit screen with search, movement/date filters, and pagination.
function StockMovements({
  stockMovements = [],
  movementLoading,
  movementError,
}) {
  const [search, setSearch] = useState("");
  const [movementType, setMovementType] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const getProductName = (movement) =>
    movement.product && typeof movement.product === "object"
      ? movement.product.name || ""
      : "";

  const getMovementType = (movement) =>
    String(movement.movementType || "unknown").toLowerCase().replace(/\s+/g, "_");

  // Filter by the displayed text and date range, then show the newest movement first.
  const filteredMovements = useMemo(() => {
    const query = search.trim().toLowerCase();
    return stockMovements.filter((movement) => {
      const searchable = [
        getProductName(movement),
        movement.movementType,
        movement.reference,
        movement.reason,
      ].join(" ").toLowerCase();
      if (query && !searchable.includes(query)) return false;

      if (movementType !== "all" && getMovementType(movement) !== movementType) return false;

      if (startDate || endDate) {
        if (!movement.createdAt) return false;
        const movementDate = new Date(movement.createdAt);
        if (Number.isNaN(movementDate.getTime())) return false;
        if (startDate) {
          const start = new Date(`${startDate}T00:00:00`);
          if (movementDate < start) return false;
        }
        if (endDate) {
          const end = new Date(`${endDate}T23:59:59.999`);
          if (movementDate > end) return false;
        }
      }
      return true;
    }).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [stockMovements, search, movementType, startDate, endDate]);

  const totalPages = Math.max(1, Math.ceil(filteredMovements.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const pageMovements = filteredMovements.slice((safePage - 1) * pageSize, safePage * pageSize);
  const firstItem = filteredMovements.length ? (safePage - 1) * pageSize + 1 : 0;
  const lastItem = Math.min(safePage * pageSize, filteredMovements.length);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, movementType, startDate, endDate, pageSize]);

  const clearFilters = () => {
    setSearch("");
    setMovementType("all");
    setStartDate("");
    setEndDate("");
    setCurrentPage(1);
  };

  return (
    <>
      <div className="panel-heading">
        <div>
          <h3>Stock Movement History</h3>
          <p>Review stock changes recorded by CourseCart.</p>
        </div>
        <button type="button" className="secondary-button" onClick={clearFilters}>
          Clear Filters
        </button>
      </div>

      <div className="movement-filters">
        <div className="movement-search-field">
          <label htmlFor="movement-search">Search</label>
          <input
            id="movement-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search product, movement type, reference, or reason..."
          />
        </div>
        <div className="movement-filter-field">
          <label htmlFor="movement-type-filter">Movement type</label>
          <select id="movement-type-filter" value={movementType} onChange={(event) => setMovementType(event.target.value)}>
            <option value="all">All movement types</option>
            {Array.from(new Set(stockMovements.map(getMovementType))).sort().map((type) => (
              <option key={type} value={type}>{type.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase())}</option>
            ))}
          </select>
        </div>
        <div className="movement-filter-field">
          <label htmlFor="movement-start-date">From date</label>
          <input id="movement-start-date" type="date" value={startDate} max={endDate || undefined} onChange={(event) => setStartDate(event.target.value)} />
        </div>
        <div className="movement-filter-field">
          <label htmlFor="movement-end-date">To date</label>
          <input id="movement-end-date" type="date" value={endDate} min={startDate || undefined} onChange={(event) => setEndDate(event.target.value)} />
        </div>
      </div>

      {movementLoading && <p className="feedback">Loading stock movement history...</p>}
      {movementError && <p className="category-error">{movementError}</p>}

      {!movementLoading && !movementError && (
        <>
          <div className="po-table-wrapper">
            {/* The table compares before/after stock and identifies who recorded each change. */}
            <table className="po-table">
              <thead>
                <tr>
                  <th>Date</th><th>Product</th><th>Status</th><th>Quantity</th>
                  <th>Previous Stock</th><th>New Stock</th><th>Reference / Reason</th><th>Performed By</th>
                </tr>
              </thead>
              <tbody>
                {pageMovements.map((movement) => {
                  const account = movement.performedBy;
                  const accountName = account && typeof account === "object"
                    ? account.name || account.username || [account.firstName, account.lastName].filter(Boolean).join(" ") || "Account recorded"
                    : "Account unavailable";
                  return (
                    <tr key={movement._id}>
                      <td>{movement.createdAt ? new Date(movement.createdAt).toLocaleString() : "—"}</td>
                      <td>{getProductName(movement) || "Product unavailable"}</td>
                      <td><span className={`po-status ${movement.movementType || ""}`}>{(movement.movementType || "unknown").replace(/_/g, " ")}</span></td>
                      <td>{movement.quantity ?? "—"}</td>
                      <td>{movement.previousStock ?? "—"}</td>
                      <td>{movement.newStock ?? "—"}</td>
                      <td>{movement.reference || movement.reason || "—"}</td>
                      <td>
                          {accountName}
                          {account && typeof account === "object" && account.role && (
                          <> ({String(account.role).toLowerCase()})</>
                          )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredMovements.length === 0 && (
              <p className="feedback">{stockMovements.length === 0 ? "No stock movements have been recorded yet." : "No stock movements match your filters."}</p>
            )}
          </div>

          <div className="movement-pagination">
            <div className="movement-page-summary">Showing {firstItem}–{lastItem} of {filteredMovements.length} movements</div>
            <div className="movement-page-controls">
              <label htmlFor="movement-page-size">Rows per page</label>
              <select id="movement-page-size" value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))}>
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
    </>
  );
}

export default StockMovements;
