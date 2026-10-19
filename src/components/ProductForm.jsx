
import { useEffect, useMemo, useRef, useState } from "react";

// Product fields are controlled by the products hook; this component handles form interaction.
function ProductForm({
  productForm,
  setProductForm,
  editingId,
  categories = [],
  productError,
  productSaving,
  saveProduct,
  onCancel,
}) {
  const [categorySearch, setCategorySearch] = useState("");
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const categoryRef = useRef(null);

  // Only active categories can be assigned to a new or edited product.
  const activeCategories = useMemo(() => {
    return (categories || [])
      .filter((category) => !category.isArchived)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [categories]);

  const selectedCategory = activeCategories.find(
    (category) => category.name === productForm.category
  );

  const filteredCategories = useMemo(() => {
    const search = categorySearch.trim().toLowerCase();

    if (!search) return activeCategories;

    return activeCategories.filter((category) =>
      category.name.toLowerCase().includes(search)
    );
  }, [activeCategories, categorySearch]);

  // Close suggestions when a click happens outside the category selector.
  useEffect(() => {
    function handleOutsideClick(event) {
      if (
        categoryRef.current &&
        !categoryRef.current.contains(event.target)
      ) {
        setIsCategoryOpen(false);
        setCategorySearch("");
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  // Save a chosen category in the parent form state, then close the suggestion list.
  function selectCategory(categoryName) {
    setProductForm((previous) => ({
      ...previous,
      category: categoryName,
    }));

    setCategorySearch("");
    setIsCategoryOpen(false);
  }

  function handleCategoryKeyDown(event) {
    if (event.key === "Escape") {
      setIsCategoryOpen(false);
      setCategorySearch("");
    }

    if (event.key === "Enter" && isCategoryOpen) {
      event.preventDefault();

      if (filteredCategories.length > 0) {
        selectCategory(filteredCategories[0].name);
      }
    }
  }

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
              setProductForm({
                ...productForm,
                name: e.target.value,
              })
            }
            required
          />
        </label>

        {/* Searchable category list gives the form valid active category values. */}
        <div className="product-category-field" ref={categoryRef}>
          <label htmlFor="product-category-search">
            Category
          </label>

          <div
            className={`searchable-category ${
              isCategoryOpen ? "is-open" : ""
            }`}
          >
            <div className="category-search-input-wrap">
              <input
                id="product-category-search"
                type="text"
                role="combobox"
                aria-autocomplete="list"
                aria-expanded={isCategoryOpen}
                aria-controls="product-category-options"
                aria-required="true"
                autoComplete="off"
                placeholder={
                  activeCategories.length
                    ? "Select or search a category..."
                    : "Create a category first"
                }
                value={
                  isCategoryOpen
                    ? categorySearch
                    : selectedCategory?.name || ""
                }
                disabled={activeCategories.length === 0}
                onFocus={() => {
                  setCategorySearch("");
                  setIsCategoryOpen(true);
                }}
                onClick={() => setIsCategoryOpen(true)}
                onChange={(e) => {
                  setCategorySearch(e.target.value);
                  setIsCategoryOpen(true);
                }}
                onKeyDown={handleCategoryKeyDown}
              />

              <button
                type="button"
                className="category-dropdown-toggle"
                aria-label={
                  isCategoryOpen
                    ? "Close category options"
                    : "Open category options"
                }
                disabled={activeCategories.length === 0}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  if (isCategoryOpen) {
                    setIsCategoryOpen(false);
                    setCategorySearch("");
                  } else {
                    setCategorySearch("");
                    setIsCategoryOpen(true);
                  }
                }}
              >
                <span
                  className={`category-chevron ${
                    isCategoryOpen ? "rotated" : ""
                  }`}
                >
                  ▼
                </span>
              </button>
            </div>

            {isCategoryOpen && activeCategories.length > 0 && (
              <div
                id="product-category-options"
                className="category-dropdown-options"
                role="listbox"
              >
                {filteredCategories.length > 0 ? (
                  filteredCategories.map((category) => (
                    <button
                      type="button"
                      role="option"
                      aria-selected={
                        productForm.category === category.name
                      }
                      className={`category-option ${
                        productForm.category === category.name
                          ? "selected"
                          : ""
                      }`}
                      key={category._id}
                      onClick={() => selectCategory(category.name)}
                    >
                      {category.name}

                      {productForm.category === category.name && (
                        <span aria-hidden="true">✓</span>
                      )}
                    </button>
                  ))
                ) : (
                  <p className="category-no-results">
                    No matching categories found.
                  </p>
                )}
              </div>
            )}
          </div>

          {!productForm.category && (
            <input
              className="category-validation-input"
              tabIndex={-1}
              autoComplete="off"
              value=""
              onChange={() => {}}
              required
              aria-label="Please select a category"
            />
          )}

          {activeCategories.length === 0 && (
            <small className="form-help">
              Create an active category in the Categories module
              before adding a product.
            </small>
          )}
        </div>

        {/* Inventory is intentionally read-only here; stock changes use receiving/sales flows. */}
        <label>
          Selling price (₱)
          <input
            name="price"
            type="number"
            min="0"
            step="0.01"
            value={productForm.price}
            onChange={(e) =>
              setProductForm({
                ...productForm,
                price: e.target.value,
              })
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

      {productError && (
        <p className="form-error">{productError}</p>
      )}

      <div className="form-actions">
        <button
          type="button"
          className="secondary-button"
          onClick={() => {
            const confirmed = window.confirm(
              "You have unsaved changes. Are you sure you want to cancel? Your changes will be lost."
            );

            if (confirmed) {
              setIsCategoryOpen(false);
              setCategorySearch("");
              onCancel();
            }
          }}
        >
          Cancel
        </button>

        <button
          type="submit"
          className="primary-button"
          disabled={productSaving}
        >
          {productSaving ? "Saving..." : "Save Product"}
        </button>
      </div>
    </form>
  );
}

export default ProductForm;
