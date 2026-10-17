import { Fragment } from "react";
import PurchaseOrderForm from "../components/PurchaseOrderForm";
import ReceiveStockPanel from "../components/ReceiveStockPanel";
import { formatAmount } from "../utils/formatters";

function PurchaseOrders({
  poSuccess,
  showPOForm,
  poSuppliers,
  poProducts,
  poLoading,
  poSupplier,
  setPoSupplier,
  poItems,
  updatePOItem,
  removePOItem,
  addPOItem,
  poTotal,
  poError,
  poSaving,
  handleCreatePurchaseOrder,
  cancelPOForm,
  togglePOForm,
  purchaseOrders,
  poSearch,
  setPoSearch,
  poStatusFilter,
  setPoStatusFilter,
  poStartDate,
  setPoStartDate,
  poEndDate,
  setPoEndDate,
  poPage,
  setPoPage,
  poPageSize,
  setPoPageSize,
  poPageCount,
  filteredPurchaseOrders,
  paginatedPurchaseOrders,
  clearPoFilters,
  receivingOrderId,
  toggleReceiving,
  receivingQuantities,
  setReceivingQuantities,
  receivingSaving,
  receivingError,
  receivingSuccess,
  handleReceiveStock,
}) {
  return (
    <>
      <div className="panel-heading">
        <div>
          <h3>Supplier Orders</h3>
          <p>Order supplies from your registered suppliers.</p>
        </div>
        <button type="button" className="primary-button" onClick={togglePOForm}>
          {showPOForm ? "Close Form" : "+ Create Purchase Order"}
        </button>
      </div>
      {poSuccess && <p className="category-success">{poSuccess}</p>}
      {showPOForm && (
        <PurchaseOrderForm
          poSuppliers={poSuppliers}
          poProducts={poProducts}
          poLoading={poLoading}
          poSupplier={poSupplier}
          setPoSupplier={setPoSupplier}
          poItems={poItems}
          updatePOItem={updatePOItem}
          removePOItem={removePOItem}
          addPOItem={addPOItem}
          poTotal={poTotal}
          poError={poError}
          poSaving={poSaving}
          onSubmit={handleCreatePurchaseOrder}
          onCancel={cancelPOForm}
        />
      )}
      {poError && !showPOForm && <p className="category-error">{poError}</p>}
      {poLoading && <p className="feedback">Loading purchase orders...</p>}
      {!poLoading && !poError && purchaseOrders.length === 0 && (
        <p className="feedback">
          No purchase orders yet. Create your first order above.
        </p>
      )}
      {!poLoading && purchaseOrders.length > 0 && (
        <>
          <div
            className="category-search"
            style={{
              display: "grid",
              gridTemplateColumns:
                "minmax(220px, 2fr) repeat(3, minmax(140px, 1fr))",
              gap: "10px",
              margin: "16px 0",
            }}
          >
            <input
              type="search"
              value={poSearch}
              onChange={(e) => {
                setPoSearch(e.target.value);
                setPoPage(1);
              }}
              placeholder="Search PO number or supplier..."
              aria-label="Search supplier orders"
            />
            <select
              value={poStatusFilter}
              onChange={(e) => {
                setPoStatusFilter(e.target.value);
                setPoPage(1);
              }}
              aria-label="Filter by order status"
            >
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="partially_received">Partially received</option>
              <option value="received">Received</option>
            </select>
            <input
              type="date"
              value={poStartDate}
              max={poEndDate || undefined}
              onChange={(e) => {
                setPoStartDate(e.target.value);
                setPoPage(1);
              }}
              aria-label="Start date"
              title="From date"
            />
            <input
              type="date"
              value={poEndDate}
              min={poStartDate || undefined}
              onChange={(e) => {
                setPoEndDate(e.target.value);
                setPoPage(1);
              }}
              aria-label="End date"
              title="To date"
            />
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "12px",
              flexWrap: "wrap",
              marginBottom: "12px",
            }}
          >
            <span className="feedback">
              Showing{" "}
              {filteredPurchaseOrders.length
                ? (poPage - 1) * poPageSize + 1
                : 0}
              –{Math.min(poPage * poPageSize, filteredPurchaseOrders.length)} of{" "}
              {filteredPurchaseOrders.length} order(s)
            </span>
            <button
              type="button"
              className="secondary-button"
              onClick={clearPoFilters}
            >
              Clear Filters
            </button>
          </div>
          <div className="po-table-wrapper">
            <table className="po-table">
              <thead>
                <tr>
                  <th>PO Number</th>
                  <th>Supplier</th>
                  <th>Order Date</th>
                  <th>Total Cost</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedPurchaseOrders.map((order) => {
                  const supplierId =
                    typeof order.supplier === "object"
                      ? order.supplier?._id
                      : order.supplier;
                  const supplierName =
                    poSuppliers.find((supplier) => supplier._id === supplierId)
                      ?.name ||
                    (typeof order.supplier === "object"
                      ? order.supplier?.name
                      : null) ||
                    "Unknown supplier";
                  const isReceiving = receivingOrderId === order._id;
                  return (
                    <Fragment key={order._id}>
                      <tr>
                        <td>{order.orderNumber}</td>
                        <td>{supplierName}</td>
                        <td>
                          {order.orderedAt
                            ? new Date(order.orderedAt).toLocaleDateString()
                            : "—"}
                        </td>
                        <td>₱{formatAmount(order.totalCost)}</td>
                        <td>
                          <span
                            className={`po-status ${order.status || "pending"}`}
                          >
                            {(order.status || "pending").replaceAll("_", " ")}
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="secondary-button"
                            onClick={() => toggleReceiving(order._id)}
                          >
                            {isReceiving ? "Close" : "Receive Stock"}
                          </button>
                        </td>
                      </tr>
                      {isReceiving && (
                        <tr className="receiving-table-row">
                          <td colSpan={6}>
                            <ReceiveStockPanel
                              order={order}
                              receivingError={receivingError}
                              receivingSuccess={receivingSuccess}
                              receivingQuantities={receivingQuantities}
                              setReceivingQuantities={setReceivingQuantities}
                              receivingSaving={receivingSaving}
                              handleReceiveStock={handleReceiveStock}
                            />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filteredPurchaseOrders.length === 0 ? (
            <p className="feedback">
              No supplier orders match your search or filters.
            </p>
          ) : (
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                alignItems: "center",
                gap: "10px",
                flexWrap: "wrap",
                marginTop: "14px",
              }}
            >
              <label
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                Rows per page
                <select
                  value={poPageSize}
                  onChange={(e) => {
                    setPoPageSize(Number(e.target.value));
                    setPoPage(1);
                  }}
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                </select>
              </label>
              <button
                type="button"
                className="secondary-button"
                disabled={poPage <= 1}
                onClick={() => setPoPage((page) => Math.max(1, page - 1))}
              >
                Previous
              </button>
              <span className="feedback">
                Page {Math.min(poPage, poPageCount)} of {poPageCount}
              </span>
              <button
                type="button"
                className="secondary-button"
                disabled={poPage >= poPageCount}
                onClick={() =>
                  setPoPage((page) => Math.min(poPageCount, page + 1))
                }
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
}

export default PurchaseOrders;
