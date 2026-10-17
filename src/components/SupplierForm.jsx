function SupplierForm({
  editingSupplier,
  supplierForm,
  supplierError,
  supplierSaving,
  onChange,
  onSubmit,
  onCancel,
}) {
  return (
    <form className="category-form" onSubmit={onSubmit}>
      <div className="form-heading">
        <h3>{editingSupplier ? "Edit Supplier" : "Add Supplier"}</h3>
        <p>
          {editingSupplier
            ? "Update the supplier's contact details."
            : "Enter the supplier's contact details."}
        </p>
      </div>
      <div className="form-grid">
        <label>
          Supplier name
          <input
            name="name"
            value={supplierForm.name}
            onChange={onChange}
            required
          />
        </label>
        <label>
          Contact person
          <input
            name="contactPerson"
            value={supplierForm.contactPerson}
            onChange={onChange}
          />
        </label>
        <label>
          Phone number
          <input name="phone" value={supplierForm.phone} onChange={onChange} />
        </label>
        <label>
          Email
          <input
            name="email"
            type="email"
            value={supplierForm.email}
            onChange={onChange}
          />
        </label>
        <label className="full-width">
          Address
          <input
            name="address"
            value={supplierForm.address}
            onChange={onChange}
          />
        </label>
      </div>
      {supplierError && <p className="category-error">{supplierError}</p>}
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
        <button className="primary-button" disabled={supplierSaving}>
          {supplierSaving
            ? "Saving..."
            : editingSupplier
              ? "Save Changes"
              : "Save Supplier"}
        </button>
      </div>
    </form>
  );
}

export default SupplierForm;
