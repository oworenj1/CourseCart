function ProductForm({
  productForm,
  setProductForm,
  editingId,
  categories,
  productError,
  productSaving,
  saveProduct,
  onCancel,
}) {
  return (
    <form className="product-form" onSubmit={saveProduct}>
      <div className="form-heading">
        <h3>{editingId ? "Edit Product" : "Add Product"}</h3>
      </div>
      <div className="form-grid">
        <label>
          Product name
          <input
            name="name"
            value={productForm.name}
            onChange={(e) =>
              setProductForm({ ...productForm, name: e.target.value })
            }
            required
          />
        </label>
        <label>
          Category
          <select
            name="category"
            value={productForm.category}
            onChange={(e) =>
              setProductForm({ ...productForm, category: e.target.value })
            }
            required
            disabled={categories.length === 0}
          >
            <option value="">
              {categories.length
                ? "Select a category"
                : "Create a category first"}
            </option>
            {categories
              .filter((category) => !category.isArchived)
              .map((category) => (
                <option key={category._id} value={category.name}>
                  {category.name}
                </option>
              ))}
          </select>
          {categories.length === 0 && (
            <small className="form-help">
              Create an active category in the Categories module before adding a
              product.
            </small>
          )}
        </label>
        <label>
          Selling price (₱)
          <input
            name="price"
            type="number"
            min="0"
            step="0.01"
            value={productForm.price}
            onChange={(e) =>
              setProductForm({ ...productForm, price: e.target.value })
            }
            required
          />
        </label>
        <label>
          {editingId ? "Current stock (read-only)" : "Initial stock"}
          <input
            name="stock"
            type="number"
            value={editingId ? productForm.stock : "0"}
            readOnly
            aria-readonly="true"
          />
          <small className="form-help">
            {editingId
              ? "Stock changes through receiving, completed sales, or authorized stock adjustments."
              : "New products start at 0. Record incoming quantities through Purchase Orders and Receiving."}
          </small>
        </label>
      </div>
      {productError && <p className="form-error">{productError}</p>}
      <div className="form-actions">
        <button
              type="button"
              className="secondary-button"
              onClick={() => {
                const confirmed = window.confirm(
                  "You have unsaved changes. Are you sure you want to cancel? Your changes will be lost."
                );

                if (confirmed) {
                  onCancel();
                }
              }}
            >
              Cancel
        </button>
        <button className="primary-button" disabled={productSaving}>
          {productSaving ? "Saving..." : "Save Product"}
        </button>
      </div>
    </form>
  );
}

export default ProductForm;
