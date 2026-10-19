
import { useState } from "react";
import { formatAmount } from "../utils/formatters";

// Search-and-select control for a PO line; its chosen product ID is stored by the parent hook.
function ProductSearchSelect({
  products,
  value,
  onChange,
  disabled,
}) {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const selectedProduct = products.find(
    (product) => product._id === value
  );

  const filteredProducts = products.filter((product) =>
    (product.name || "")
      .toLowerCase()
      .includes(search.trim().toLowerCase())
  );

  const selectProduct = (product) => {
    onChange(product._id);
    setSearch("");
    setIsOpen(false);
  };

  return (
    <div className="po-product-search">
      <input
        type="search"
        value={isOpen ? search : selectedProduct?.name || ""}
        placeholder="Search products..."
        autoComplete="off"
        disabled={disabled}
        required={!value}
        onFocus={() => {
          setSearch("");
          setIsOpen(true);
        }}
        onChange={(e) => {
          setSearch(e.target.value);
          setIsOpen(true);

          if (value) {
            onChange("");
          }
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setIsOpen(false);
            setSearch("");
          }

          if (e.key === "Enter" && isOpen) {
            e.preventDefault();

            if (filteredProducts.length > 0) {
              selectProduct(filteredProducts[0]);
            }
          }
        }}
        aria-label="Search and select a product"
        aria-expanded={isOpen}
      />

      {isOpen && (
        <>
          <button
            type="button"
            className="po-product-search-backdrop"
            aria-label="Close product suggestions"
            onClick={() => {
              setIsOpen(false);
              setSearch("");
            }}
          />

          <div className="po-product-search-results">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <button
                  type="button"
                  key={product._id}
                  className={`po-product-search-option ${
                    product._id === value ? "selected" : ""
                  }`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => selectProduct(product)}
                >
                  <span>{product.name}</span>
                  {product.category && (
                    <small>{product.category}</small>
                  )}
                </button>
              ))
            ) : (
              <p className="po-product-search-empty">
                No matching products found.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}


// Supplier counterpart to ProductSearchSelect, returning the selected supplier ID.
function SupplierSearchSelect({
  suppliers,
  value,
  onChange,
  disabled,
}) {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const selectedSupplier = suppliers.find(
    (supplier) => supplier._id === value
  );

  const filteredSuppliers = suppliers.filter((supplier) =>
    (supplier.name || "")
      .toLowerCase()
      .includes(search.trim().toLowerCase())
  );

  return (
    <div className="po-product-search">
      <input
        type="text"
        value={isOpen ? search : selectedSupplier?.name || ""}
        placeholder="Search suppliers..."
        autoComplete="off"
        disabled={disabled}
        required={!value}
        onFocus={() => {
          setSearch("");
          setIsOpen(true);
        }}
        onChange={(e) => {
          setSearch(e.target.value);
          setIsOpen(true);

          if (value) {
            onChange("");
          }
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setIsOpen(false);
            setSearch("");
          }

          if (e.key === "Enter" && isOpen) {
            e.preventDefault();

            if (filteredSuppliers.length > 0) {
              onChange(filteredSuppliers[0]._id);
              setSearch("");
              setIsOpen(false);
            }
          }
        }}
        aria-label="Search and select a supplier"
        aria-expanded={isOpen}
      />

      {isOpen && (
        <>
          <button
            type="button"
            className="po-product-search-backdrop"
            aria-label="Close supplier suggestions"
            onClick={() => {
              setIsOpen(false);
              setSearch("");
            }}
          />

          <div className="po-product-search-results">
            {filteredSuppliers.length > 0 ? (
              filteredSuppliers.map((supplier) => (
                <button
                  type="button"
                  key={supplier._id}
                  className={`po-product-search-option ${
                    supplier._id === value ? "selected" : ""
                  }`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onChange(supplier._id);
                    setSearch("");
                    setIsOpen(false);
                  }}
                >
                  <span>{supplier.name}</span>
                </button>
              ))
            ) : (
              <p className="po-product-search-empty">
                No matching suppliers found.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}


// Builds a purchase order from supplier and product rows, reporting input changes to its hook.
function PurchaseOrderForm({
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
  onSubmit,
  onCancel,
}) {
  return (
    <form className="category-form" onSubmit={onSubmit}>
      <div className="form-heading">
        <h3>New Purchase Order</h3>
        <p>Select a supplier and add the products you want to order.</p>
      </div>


      {/* The supplier and item controls are controlled by the usePurchaseOrders hook. */}
      <label>
        Supplier
        <SupplierSearchSelect
          suppliers={poSuppliers}
          value={poSupplier}
          onChange={setPoSupplier}
          disabled={poLoading || poSaving}
        />
      </label>


      {poSuppliers.length === 0 && !poLoading && (
        <p className="feedback">
          No active suppliers found. Add a supplier first.
        </p>
      )}

      {/* Each row is one ordered product, quantity, and supplier unit cost. */}
      {poItems.map((item, index) => (
        <div className="po-item-row" key={index}>
          <label>
            Product
            <ProductSearchSelect
              products={poProducts}
              value={item.product}
              onChange={(value) =>
                updatePOItem(index, "product", value)
              }
              disabled={poLoading || poSaving}
            />
          </label>

          <label>
            Quantity
            <input
              type="number"
              min="1"
              step="1"
              required
              value={item.quantityOrdered}
              disabled={poSaving}
              onChange={(e) =>
                updatePOItem(
                  index,
                  "quantityOrdered",
                  e.target.value
                )
              }
            />
          </label>

          
          <label>
            Unit cost (₱)
            <input
              type="number"
              min="0"
              step="0.01"
              required
              value={item.unitCost}
              disabled={poSaving}
              onChange={(e) =>
                updatePOItem(index, "unitCost", e.target.value)
              }
            />

            <small
              style={{
                display: "block",
                marginTop: "8px",
                color: "#64748b",
                fontSize: "12px",
                fontWeight: 500,
              }}
            >
              Subtotal:{" "}
              <strong style={{ color: "#203961" }}>
                ₱
                {formatAmount(
                  Math.max(0, Number(item.quantityOrdered) || 0) *
                    Math.max(0, Number(item.unitCost) || 0)
                )}
              </strong>
            </small>
          </label>


          <button
            type="button"
            className="archive-button"
            disabled={poItems.length === 1 || poSaving}
            onClick={() => removePOItem(index)}
          >
            Remove
          </button>
        </div>
      ))}

      <button
        type="button"
        className="secondary-button"
        onClick={addPOItem}
        disabled={poSaving}
      >
        + Add Another Product
      </button>

      <div className="po-total">
        <span>Estimated Total Cost</span>
        <strong>₱{formatAmount(poTotal)}</strong>
      </div>

      {poError && <p className="category-error">{poError}</p>}

      <div className="form-actions">
        <button
          type="button"
          className="secondary-button"
          onClick={() => {
              const confirmed = window.confirm(
                "Are you sure you want to cancel creating this purchase order? Your unsaved changes will be lost."
              );

              if (confirmed) {
                onCancel();
              }
            }}
            disabled={poSaving}
          >
          Cancel
        </button>

        <button
          type="submit"
          className="primary-button"
          disabled={
            poSaving ||
            poLoading ||
            poSuppliers.length === 0 ||
            poProducts.length === 0
          }
        >
          {poSaving ? "Creating..." : "Create Purchase Order"}
        </button>
      </div>
    </form>
  );
}

export default PurchaseOrderForm;
