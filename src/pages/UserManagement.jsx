import { useEffect, useMemo, useState } from "react";
import SubTabs from "../components/SubTabs";
import UserForm from "../components/UserForm";

const PAGE_SIZE_OPTIONS = [10, 25, 50];

function UserManagement({
  authUser, usersView, changeUsersView, usersSuccess, showUserForm,
  editingUserId, userForm, setUserForm, usersError, usersSaving, saveUser,
  cancelUserForm, toggleUserForm, usersSearch, setUsersSearch, usersLoading,
  displayedUsers, openEditUser, toggleUserStatus, archiveOrRestoreUser,
}) {
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const filteredUsers = useMemo(() => {
    return displayedUsers.filter((user) => {
      const roleMatches = roleFilter === "all" || user.role === roleFilter;
      const status = user.isArchived ? "archived" : (user.status || "inactive").toLowerCase();
      const statusMatches = statusFilter === "all" || status === statusFilter;
      const created = user.createdAt ? new Date(user.createdAt) : null;
      const dateValue = created && !Number.isNaN(created.getTime())
        ? `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, "0")}-${String(created.getDate()).padStart(2, "0")}`
        : "";
      const fromMatches = !fromDate || (dateValue && dateValue >= fromDate);
      const toMatches = !toDate || (dateValue && dateValue <= toDate);
      return roleMatches && statusMatches && fromMatches && toMatches;
    });
  }, [displayedUsers, roleFilter, statusFilter, fromDate, toDate]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const pageUsers = filteredUsers.slice((safePage - 1) * pageSize, safePage * pageSize);

  useEffect(() => { setCurrentPage(1); }, [usersSearch, roleFilter, statusFilter, fromDate, toDate, pageSize, usersView]);

  const clearFilters = () => {
    setUsersSearch("");
    setRoleFilter("all");
    setStatusFilter("all");
    setFromDate("");
    setToDate("");
    setCurrentPage(1);
  };

  const roleLabel = (role) => role === "inventory" ? "Inventory Staff" : role ? role[0].toUpperCase() + role.slice(1) : "—";

  return (
    <>
      <SubTabs
        views={[
          { value: "active", label: "Active Accounts" },
          { value: "archived", label: "Archived Accounts" },
        ]}
        current={usersView}
        onChange={changeUsersView}
      />
      <div className="panel-heading">
        <div><h3>Accounts</h3><p>Create accounts and manage staff access by role.</p></div>
        {usersView === "active" && <button type="button" className="primary-button" onClick={toggleUserForm}>{showUserForm ? "Close Form" : "+ Add User"}</button>}
      </div>
      {usersSuccess && <p className="category-success">{usersSuccess}</p>}
      {showUserForm && usersView === "active" && <UserForm authUser={authUser} userForm={userForm} setUserForm={setUserForm} editingUserId={editingUserId} usersError={usersError} usersSaving={usersSaving} saveUser={saveUser} onCancel={cancelUserForm} />}

      <div className="user-filter-grid">
        <label className="user-filter-search">Search
          <input type="search" value={usersSearch} onChange={(e) => setUsersSearch(e.target.value)} placeholder="Search name, email, role, or status..." aria-label="Search user accounts" />
        </label>
        <label>Role
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="all">All roles</option><option value="admin">Admin</option><option value="cashier">Cashier</option><option value="inventory">Inventory Staff</option>
          </select>
        </label>
        <label>Status
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All statuses</option>
            {usersView === "archived" ? <option value="archived">Archived</option> : <><option value="active">Active</option><option value="inactive">Inactive</option></>}
          </select>
        </label>
        <label>From date<input type="date" value={fromDate} max={toDate || undefined} onChange={(e) => setFromDate(e.target.value)} /></label>
        <label>To date<input type="date" value={toDate} min={fromDate || undefined} onChange={(e) => setToDate(e.target.value)} /></label>
        
      </div>

      {usersError && <p className="category-error" role="alert">{usersError}</p>}
      {usersLoading && <p className="feedback">Loading user accounts...</p>}
      {!usersLoading && <>
       <div className="user-results-toolbar">
          <div className="user-results-summary">
            Showing {filteredUsers.length
              ? (safePage - 1) * pageSize + 1
              : 0}
            –{Math.min(safePage * pageSize, filteredUsers.length)} of{" "}
            {filteredUsers.length} account(s)
          </div>

          <button
            type="button"
            className="secondary-button"
            onClick={clearFilters}
          >
            Clear Filters
          </button>
        </div>
        <div className="po-table-wrapper">
          <table className="po-table">
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead>
            <tbody>
              {pageUsers.map((user) => {
                const id = user.id || user._id;
                const isSelf = id === authUser.id;
                return <tr key={id}>
                  <td>{[user.firstName, user.lastName].filter(Boolean).join(" ") || "—"}{isSelf ? " (You)" : ""}</td>
                  <td>{user.email}</td><td>{roleLabel(user.role)}</td>
                  <td><span className={`po-status ${user.isArchived ? "cancelled" : user.status === "active" ? "received" : "pending"}`}>{user.isArchived ? "Archived" : user.status === "active" ? "Active" : "Inactive"}</span></td>
                  <td>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}</td>
                  <td><div className="user-row-actions">
                    {usersView === "active" ? <>
                      <button type="button" className="secondary-button" disabled={isSelf} title={isSelf ? "You cannot edit your own Admin account." : "Edit account"} onClick={() => openEditUser(user)}>{isSelf ? "Your Account" : "Edit"}</button>
                      <button type="button" className="secondary-button" disabled={isSelf} title={isSelf ? "Ask another Admin to manage this account." : "Change account status"} onClick={() => toggleUserStatus(user)}>{user.status === "active" ? "Deactivate" : "Activate"}</button>
                      <button type="button" className="archive-button" disabled={isSelf} onClick={() => archiveOrRestoreUser(user)}>Archive</button>
                    </> : <button type="button" className="restore-button" onClick={() => archiveOrRestoreUser(user)}>Restore</button>}
                  </div></td>
                </tr>;
              })}
            </tbody>
          </table>
          {!pageUsers.length && <p className="feedback">{usersView === "archived" ? "No archived user accounts match these filters." : "No user accounts match your filters."}</p>}
        </div>
        {filteredUsers.length > 0 && <div className="user-pagination">
          <label>Rows per page <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>{PAGE_SIZE_OPTIONS.map((size) => <option key={size} value={size}>{size}</option>)}</select></label>
          <span>Page {safePage} of {totalPages}</span>
          <div className="user-pagination-buttons">
            <button type="button" className="secondary-button" disabled={safePage === 1} onClick={() => setCurrentPage(1)}>First</button>
            <button type="button" className="secondary-button" disabled={safePage === 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}>Previous</button>
            <button type="button" className="secondary-button" disabled={safePage === totalPages} onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}>Next</button>
            <button type="button" className="secondary-button" disabled={safePage === totalPages} onClick={() => setCurrentPage(totalPages)}>Last</button>
          </div>
        </div>}
      </>}
    </>
  );
}

export default UserManagement;
