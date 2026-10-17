import { getSaleItemName } from "../utils/reportCalculations";

function SaleDetails({ selectedSale, onClose }) {
  return (
    <div
      className="receiving-panel"
      role="dialog"
      aria-modal="true"
      aria-label="Transaction details"
      style={{ marginTop: 20 }}
    >
      <div className="panel-heading">
        <div>
          <h3>Transaction Details</h3>
          <p>{selectedSale.transactionNumber || "Transaction"}</p>
        </div>
        <button type="button" className="secondary-button" onClick={onClose}>
          Close
        </button>
      </div>
      <div className="po-table-wrapper">
        <table className="po-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Quantity</th>
              <th>Unit Price</th>
              <th>Line Total</th>
            </tr>
          </thead>
          <tbody>
            {(selectedSale.items || []).map((item, index) => {
              const productName = getSaleItemName(item);
              return (
                <tr key={item._id || `${productName}-${index}`}>
                  <td>{productName}</td>
                  <td>{item.quantity ?? "—"}</td>
                  <td>
                    ₱
                    {Number(item.unitPrice ?? item.product?.price ?? 0).toFixed(
                      2,
                    )}
                  </td>
                  <td>
                    ₱
                    {Number(
                      item.lineTotal ??
                        Number(item.unitPrice || 0) *
                          Number(item.quantity || 0),
                    ).toFixed(2)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div style={{ display: "grid", gap: 8, marginTop: 16 }}>
        <div className="pos-total-row">
          <span>Subtotal</span>
          <strong>₱{Number(selectedSale.subtotal || 0).toFixed(2)}</strong>
        </div>
        <div className="pos-total-row">
          <span>Discount</span>
          <strong>₱{Number(selectedSale.discount || 0).toFixed(2)}</strong>
        </div>
        <div className="pos-total-row">
          <span>Total</span>
          <strong>₱{Number(selectedSale.total || 0).toFixed(2)}</strong>
        </div>
        <div className="pos-total-row">
          <span>Amount Paid</span>
          <strong>₱{Number(selectedSale.amountPaid || 0).toFixed(2)}</strong>
        </div>
        <div className="pos-total-row">
          <span>Change</span>
          <strong>₱{Number(selectedSale.change || 0).toFixed(2)}</strong>
        </div>
        <div className="pos-total-row">
          <span>Payment Method</span>
          <strong>
            {String(selectedSale.paymentMethod || "—").toUpperCase()}
          </strong>
        </div>
      </div>
    </div>
  );
}

export default SaleDetails;
