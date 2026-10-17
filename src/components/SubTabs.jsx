// The small "Active / Archived" tab switcher used by several screens.
// views: [{ value: "active", label: "Active Products" }, ...]
function SubTabs({ views, current, onChange }) {
  return (
    <div className="view-tabs sub-tabs">
      {views.map(({ value, label }) => (
        <button
          key={value}
          type="button"
          className={`view-tab ${current === value ? "selected" : ""}`}
          onClick={() => onChange(value)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export default SubTabs;
