// Controlled category form: values and submit/cancel actions come from useCategories.
function CategoryForm({
  editingCategory,
  categoryName,
  setCategoryName,
  categoryDescription,
  setCategoryDescription,
  categoryError,
  categorySaving,
  onSubmit,
  onCancel,
}) {
  return (
    <form className="category-form" onSubmit={onSubmit}>
      {/* The same fields are reused for creating and editing a category. */}
      <div className="form-heading">
        <h3>{editingCategory ? "Edit Category" : "Add Category"}</h3>
        <p>
          {editingCategory
            ? "Update the category details."
            : "Create a category for your school supplies."}
        </p>
      </div>
      <label>
        Category name
        <input
          value={categoryName}
          onChange={(e) => setCategoryName(e.target.value)}
          required
        />
      </label>
      <label>
        Description
        <textarea
          value={categoryDescription}
          onChange={(e) => setCategoryDescription(e.target.value)}
          rows="3"
        />
      </label>
      {categoryError && <p className="category-error">{categoryError}</p>}
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
        <button className="primary-button" disabled={categorySaving}>
          {categorySaving
            ? "Saving..."
            : editingCategory
              ? "Save Changes"
              : "Save Category"}
        </button>
      </div>
    </form>
  );
}

export default CategoryForm;
