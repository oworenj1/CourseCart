// Shows receiving progress for an order and sends each submitted line to usePurchaseOrders.
function ReceiveStockPanel({
  order,
  receivingError,
  receivingSuccess,
  receivingQuantities,
  setReceivingQuantities,
  receivingSaving,
  handleReceiveStock,
}) {
  return (
    <div className="receiving-panel">
      <div className="form-heading">
        <h3>Receive Stock</h3>
        <p>Purchase Order: {order.orderNumber}</p>
      </div>
      {receivingError && <p className="category-error">{receivingError}</p>}
      {receivingSuccess && (
        <p className="category-success">{receivingSuccess}</p>
      )}
      {/* Calculate remaining units so the user can only enter a quantity still due. */}
      {(order.items || []).map((item, index) => {
        const ordered = Number(item.quantityOrdered || 0);
        const received = Number(item.quantityReceived || 0);
        const remaining = Math.max(0, ordered - received);
        const inputKey = `${order._id}-${index}`;
        const productName =
          item.productName ||
          (typeof item.product === "object" ? item.product?.name : null) ||
          "Product";
        return (
          <div className="receiving-item" key={inputKey}>
            <div className="receiving-item-info">
              <strong>{productName}</strong>
              <span>Ordered: {ordered}</span>
              <span>Received: {received}</span>
              <span>Remaining: {remaining}</span>
            </div>
            <form
              className="receiving-form"
              onSubmit={(e) => {
                e.preventDefault();
                handleReceiveStock(order, index);
              }}
            >
              <label>
                Quantity to receive
                <input
                  type="number"
                  min="1"
                  max={remaining}
                  step="1"
                  required
                  disabled={
                    remaining === 0 ||
                    receivingSaving ||
                    order.status === "cancelled"
                  }
                  value={receivingQuantities[inputKey] ?? ""}
                  onChange={(e) => {
                    setReceivingQuantities((previous) => ({
                      ...previous,
                      [inputKey]: e.target.value,
                    }));
                  }}
                  placeholder={
                    remaining === 0 ? "Fully received" : "Enter quantity"
                  }
                />
              </label>
              <button
                type="submit"
                className="primary-button"
                disabled={
                  remaining === 0 ||
                  receivingSaving ||
                  order.status === "cancelled"
                }
              >
                {receivingSaving ? "Processing..." : "Confirm Receipt"}
              </button>
            </form>
          </div>
        );
      })}
      {order.status === "cancelled" && (
        <p className="receiving-note">
          This purchase order is cancelled and cannot receive stock.
        </p>
      )}
      {order.status === "received" && (
        <p className="receiving-note">
          All items in this purchase order have been received.
        </p>
      )}
    </div>
  );
}

export default ReceiveStockPanel;
