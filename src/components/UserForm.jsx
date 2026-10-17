function UserForm({
  authUser,
  userForm,
  setUserForm,
  editingUserId,
  usersError,
  usersSaving,
  saveUser,
  onCancel,
}) {
  return (
    <form className="category-form" onSubmit={saveUser}>
      <div className="form-heading">
        <h3>{editingUserId ? "Edit User Account" : "Create User Account"}</h3>
        <p>
          {editingUserId
            ? "Update the account details and access. You cannot edit your own Admin account."
            : "New accounts will be active after creation."}
        </p>
      </div>
      <div className="form-grid">
        <label>
          First name
          <input
            value={userForm.firstName}
            onChange={(e) =>
              setUserForm({ ...userForm, firstName: e.target.value })
            }
            required
          />
        </label>
        <label>
          Last name
          <input
            value={userForm.lastName}
            onChange={(e) =>
              setUserForm({ ...userForm, lastName: e.target.value })
            }
            required
          />
        </label>
        <label>
          Email address
          <input
            type="email"
            value={userForm.email}
            onChange={(e) =>
              setUserForm({ ...userForm, email: e.target.value })
            }
            required
          />
        </label>
        <label>
          {editingUserId ? "New password (optional)" : "Password"}
          <input
            type="password"
            autoComplete="new-password"
            value={userForm.password}
            onChange={(e) =>
              setUserForm({ ...userForm, password: e.target.value })
            }
            minLength={8}
            required={!editingUserId}
            placeholder={
              editingUserId
                ? "Leave blank to keep current password"
                : "At least 8 characters"
            }
          />
        </label>
        <label>
          Role
          <select
            value={userForm.role}
            disabled={editingUserId === authUser.id}
            onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
          >
            <option value="admin">Admin</option>
            <option value="cashier">Cashier</option>
            <option value="inventory">Inventory Staff</option>
          </select>
        </label>
        {editingUserId && (
          <label>
            Account status
            <select
              value={userForm.status}
              disabled={editingUserId === authUser.id}
              onChange={(e) =>
                setUserForm({ ...userForm, status: e.target.value })
              }
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </label>
        )}
      </div>
      {usersError && (
        <p className="category-error" role="alert">
          {usersError}
        </p>
      )}
      <div className="form-actions">
        <button type="button" className="secondary-button" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="primary-button" disabled={usersSaving}>
          {usersSaving
            ? "Saving..."
            : editingUserId
              ? "Save Changes"
              : "Create Account"}
        </button>
      </div>
    </form>
  );
}

export default UserForm;
