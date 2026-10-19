// The small "Active / Archived" tab switcher used by several screens.
// views: [{ value: "active", label: "Active Products" }, ...]
// The parent owns the selected value and decides which records to load or show.
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
