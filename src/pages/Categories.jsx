
import { useEffect, useState } from "react";
import SubTabs from "../components/SubTabs";
import CategoryForm from "../components/CategoryForm";

// Category management screen: active/archive tabs, search, form, cards, and pagination.
function Categories({
  categoryView,
  changeCategoryView,
  toggleCategoryForm,
  categorySuccess,
  showCategoryForm,
  editingCategory,
  categoryName,
  setCategoryName,
  categoryDescription,
  setCategoryDescription,
  categoryError,
  categorySaving,
  handleCreateCategory,
  cancelCategoryForm,
  categorySearch,
  setCategorySearch,
  categoryLoading,
  filteredCategories,
  startEditCategory,
  handleArchiveCategory,
  handleRestoreCategory,
}) {
  // Keep the card grid short; the selected page size controls how many categories appear.
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredCategories.length / pageSize)
  );

  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedCategories = filteredCategories.slice(
    (safeCurrentPage - 1) * pageSize,
    safeCurrentPage * pageSize
  );

  // Start at the first page when the visible result set changes.
  useEffect(() => {
    setCurrentPage(1);
  }, [categorySearch, categoryView, pageSize]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  return (
    <>
      <SubTabs
        views={[
          { value: "active", label: "Active Categories" },
          { value: "archived", label: "Archived Categories" },
        ]}
        current={categoryView}
        onChange={changeCategoryView}
      />

      <div className="panel-heading">
        <div>
          <h3>Categories</h3>
          <p>Organize your school supplies.</p>
        </div>


          {categoryView === "active" && (
            <button
              type="button"
              className="primary-button"
              onClick={toggleCategoryForm}
              disabled={showCategoryForm}
              title={
                showCategoryForm
                  ? "Finish or cancel the current category form first."
                  : "Add a new category"
              }
            >
              {showCategoryForm ? "Category Form Open" : "+ Add Category"}
            </button>
          )}

      </div>

      {categorySuccess && (
        <p className="category-success">{categorySuccess}</p>
      )}

      {showCategoryForm && categoryView === "active" && (
        <CategoryForm
          editingCategory={editingCategory}
          categoryName={categoryName}
          setCategoryName={setCategoryName}
          categoryDescription={categoryDescription}
          setCategoryDescription={setCategoryDescription}
          categoryError={categoryError}
          categorySaving={categorySaving}
          onSubmit={handleCreateCategory}
          onCancel={cancelCategoryForm}
        />
      )}

      <div className="category-search">
        <input
          type="search"
          placeholder="Search categories..."
          value={categorySearch}
          onChange={(e) => setCategorySearch(e.target.value)}
          aria-label="Search categories"
        />
      </div>

      {categoryError && !showCategoryForm && (
        <p className="category-error">{categoryError}</p>
      )}

      {categoryLoading && (
        <p className="feedback">Loading categories...</p>
      )}

      {!categoryLoading && (
        <>
          <div className="category-results-toolbar">
            <span className="feedback">
              Showing{" "}
              {filteredCategories.length === 0
                ? 0
                : (safeCurrentPage - 1) * pageSize + 1}
              –
              {Math.min(
                safeCurrentPage * pageSize,
                filteredCategories.length
              )}{" "}
              of {filteredCategories.length} categor(y/ies)
            </span>

            <label className="category-page-size">
              Show
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                aria-label="Categories per page"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
              </select>
              per page
            </label>
          </div>

          {filteredCategories.length === 0 ? (
            <p className="feedback">No categories found.</p>
          ) : (
            <>
              {/* Each card displays one category and the actions allowed in its current view. */}
              <div className="category-grid">
                {paginatedCategories.map((c) => (
                  <article className="category-card" key={c._id}>
                    <div className="category-card-top">
                      <div className="category-symbol">▦</div>

                      <span
                        className={`category-badge ${
                          categoryView === "archived" ? "archived" : ""
                        }`}
                      >
                        {categoryView === "active" ? "Active" : "Archived"}
                      </span>
                    </div>

                    <h4>{c.name}</h4>

                    <p className="category-description">
                      {c.description || "No description provided."}
                    </p>

                    <div className="category-actions">
                      {categoryView === "active" ? (
                        <>
                          <button
                            type="button"
                            className="secondary-button"
                            onClick={() => startEditCategory(c)}
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            className="category-archive-button"
                            onClick={() => handleArchiveCategory(c)}
                          >
                            Archive
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          className="category-restore-button"
                          onClick={() => handleRestoreCategory(c)}
                        >
                          Restore
                        </button>
                      )}
                    </div>
                  </article>
                ))}
              </div>

              <div className="category-pagination">
                <span>
                  Page {safeCurrentPage} of {totalPages}
                </span>

                <div className="category-pagination-actions">
                  <button
                    type="button"
                    className="secondary-button"
                    disabled={safeCurrentPage === 1}
                    onClick={() => setCurrentPage(1)}
                  >
                    First
                  </button>

                  <button
                    type="button"
                    className="secondary-button"
                    disabled={safeCurrentPage === 1}
                    onClick={() =>
                      setCurrentPage((page) => Math.max(1, page - 1))
                    }
                  >
                    Previous
                  </button>

                  <button
                    type="button"
                    className="secondary-button"
                    disabled={safeCurrentPage === totalPages}
                    onClick={() =>
                      setCurrentPage((page) =>
                        Math.min(totalPages, page + 1)
                      )
                    }
                  >
                    Next
                  </button>

                  <button
                    type="button"
                    className="secondary-button"
                    disabled={safeCurrentPage === totalPages}
                    onClick={() => setCurrentPage(totalPages)}
                  >
                    Last
                  </button>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </>
  );
}

export default Categories;
