import { useState } from "react";
import NavTabs from "./NavTabs";

function Header({ authUser, onLogout, role, module, onSelect }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSelect = (nextModule) => {
    onSelect(nextModule);
    setMobileOpen(false);
  };

  const fullName =
    [authUser.firstName, authUser.lastName].filter(Boolean).join(" ") ||
    authUser.email ||
    "Account";

  return (
    <>
      <button
        type="button"
        className="mobile-menu-toggle"
        aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
        aria-expanded={mobileOpen}
        onClick={() => setMobileOpen((open) => !open)}
      >
        <span />
        <span />
        <span />
      </button>

      {mobileOpen && (
        <button
          type="button"
          className="sidebar-backdrop"
          aria-label="Close navigation menu"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={`topbar sidebar ${mobileOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-brand-area">
          <div className="brand">
            <img
              src="/coursecart-logo.png"
              alt="CourseCart logo"
              className="brand-logo-image"
            />
            <div>
              <h1>CourseCart</h1>
              <p>Inventory Management</p>
            </div>
          </div>
          <div className="sidebar-system-status">
            <span className="status-dot" />
            <span>Inventory System</span>
          </div>
        </div>

        <div className="sidebar-nav-heading">WORKSPACE</div>
        <NavTabs
          role={role}
          module={module}
          onSelect={handleSelect}
        />

        <div className="sidebar-account">
          <div className="sidebar-account-avatar" aria-hidden="true">
            {fullName.charAt(0).toUpperCase()}
          </div>
          <div className="sidebar-account-info">
            <strong title={fullName}>{fullName}</strong>
            <span>{String(authUser.role || "user").replace(/[_-]+/g, " ")}</span>
          </div>
          <button type="button" className="sidebar-logout" onClick={onLogout}>
            Log Out
          </button>
        </div>
      </aside>
    </>
  );
}

export default Header;
