import { useEffect, useState } from "react";

function formatDateForDisplay(value) {
  if (!value) return "";
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return value;
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    month: "long", day: "numeric", year: "numeric",
  });
}

function ReportDatePicker({ label, value, onChange, min }) {
  const [open, setOpen] = useState(false);
  const initial = value ? new Date(`${value}T12:00:00`) : new Date();
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());

  useEffect(() => {
    if (value) {
      const selected = new Date(`${value}T12:00:00`);
      if (!Number.isNaN(selected.getTime())) {
        setViewYear(selected.getFullYear());
        setViewMonth(selected.getMonth());
      }
    }
  }, [value]);

  const monthStart = new Date(viewYear, viewMonth, 1);
  const firstDay = monthStart.getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  const selectedDate = value ? new Date(`${value}T12:00:00`) : null;
  const minDate = min ? new Date(`${min}T00:00:00`) : null;
  const years = Array.from({ length: 21 }, (_, i) => new Date().getFullYear() - 10 + i);

  const moveMonth = (delta) => {
    const next = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  };

  const chooseDay = (day) => {
    const picked = new Date(viewYear, viewMonth, day);
    if (minDate && picked < minDate) return;
    const yyyy = picked.getFullYear();
    const mm = String(picked.getMonth() + 1).padStart(2, "0");
    const dd = String(picked.getDate()).padStart(2, "0");
    onChange(`${yyyy}-${mm}-${dd}`);
    setOpen(false);
  };

  return (
    <div className="report-date-picker">
      <span className="report-date-label">{label}</span>
      <div className="report-date-control">
        <button
          type="button"
          className="report-date-trigger"
          aria-label={`Choose ${label.toLowerCase()}`}
          aria-expanded={open}
          onClick={() => setOpen((current) => !current)}
          title={`Choose ${label.toLowerCase()}`}
        >
          <svg aria-hidden="true" className="report-calendar-icon" viewBox="0 0 24 24" fill="none">
            <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" stroke="currentColor" strokeWidth="1.7" />
            <path d="M7.5 3.5v3M16.5 3.5v3M4 9.5h16" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            <path d="M8 13h.01M12 13h.01M16 13h.01M8 16.5h.01M12 16.5h.01" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        </button>
        <div className="report-date-value" aria-live="polite">
          {value ? formatDateForDisplay(value) : "Select month, day, and year"}
        </div>
      </div>
      {open && (
        <div className="report-calendar-popover">
          <div className="report-calendar-heading">
            <button type="button" className="report-calendar-nav" aria-label="Previous month" onClick={() => moveMonth(-1)}>‹</button>
            <div className="report-calendar-selects">
              <select aria-label="Calendar month" value={viewMonth} onChange={(e) => setViewMonth(Number(e.target.value))}>
                {monthNames.map((name, index) => <option key={name} value={index}>{name}</option>)}
              </select>
              <select aria-label="Calendar year" value={viewYear} onChange={(e) => setViewYear(Number(e.target.value))}>
                {years.map((year) => <option key={year} value={year}>{year}</option>)}
              </select>
            </div>
            <button type="button" className="report-calendar-nav" aria-label="Next month" onClick={() => moveMonth(1)}>›</button>
          </div>
          <div className="report-calendar-grid report-calendar-weekdays">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => <span key={day}>{day}</span>)}
          </div>
          <div className="report-calendar-grid">
            {Array.from({ length: firstDay }, (_, i) => <span key={`blank-${i}`} />)}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const current = new Date(viewYear, viewMonth, day);
              const isDisabled = Boolean(minDate && current < minDate);
              const isSelected = Boolean(selectedDate &&
                selectedDate.getFullYear() === viewYear &&
                selectedDate.getMonth() === viewMonth &&
                selectedDate.getDate() === day);
              const isToday = (() => {
                const today = new Date();
                return today.getFullYear() === viewYear && today.getMonth() === viewMonth && today.getDate() === day;
              })();
              return (
                <button
                  key={day}
                  type="button"
                  disabled={isDisabled}
                  className={`report-calendar-day${isSelected ? " selected" : ""}${isToday ? " today" : ""}`}
                  onClick={() => chooseDay(day)}
                >{day}</button>
              );
            })}
          </div>
          <div className="report-calendar-footer">
            <button type="button" className="report-calendar-clear" onClick={() => { onChange(""); setOpen(false); }}>Clear date</button>
            <button type="button" className="report-calendar-close" onClick={() => setOpen(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}


export default ReportDatePicker;
