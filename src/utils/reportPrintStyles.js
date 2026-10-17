// Print-only CSS used by the Reports screen (kept exactly as it was in App.jsx).
export const reportPrintStyles = `@media print {
body { background: #fff !important; }
.topbar, .view-tabs, .page-heading, .footer, .reports-print-area button,
.reports-print-area input, .reports-print-area label span { display: none !important; }
.app, .page-content, .inventory-panel, .reports-print-area { width:100% !important; max-width:none !important; margin:0 !important; padding:0 !important; border:0 !important; box-shadow:none !important; background:#fff !important; }
.panel-heading, .dashboard-stat-grid, .receiving-panel, table { break-inside: avoid; }
.po-table-wrapper { overflow: visible !important; }
.po-table { width:100% !important; font-size:10pt !important; }
.po-table th, .po-table td { padding:6px !important; }

.report-date-fields { align-items: start !important; }
.report-date-picker { position: relative; display: flex; flex-direction: column; gap: 8px; min-width: 0; }
.report-date-label { font-weight: 600; color: #344563; }
.report-date-trigger { width: 100%; min-height: 52px; display: flex; align-items: center; justify-content: space-between; gap: 12px; text-align: left; padding: 12px 14px; border: 1px solid #d7dfeb; border-radius: 10px; background: #fff; color: #23395d; cursor: pointer; font: inherit; }
.report-date-trigger:hover, .report-date-trigger:focus-visible { border-color: #34558b; outline: none; box-shadow: 0 0 0 3px rgba(52,85,139,.12); }
.report-date-placeholder { color: #8a96a8; }
.report-calendar-icon { font-size: 20px; color: #294778; }
.report-calendar-popover { position: absolute; z-index: 50; top: calc(100% + 6px); left: 0; width: min(320px, calc(100vw - 48px)); padding: 14px; border: 1px solid #dbe3ee; border-radius: 14px; background: #fff; box-shadow: 0 14px 40px rgba(28,45,74,.2); color: #263750; }
.report-calendar-heading { display: flex; align-items: center; justify-content: space-between; gap: 6px; margin-bottom: 12px; }
.report-calendar-selects { display: flex; flex: 1; gap: 6px; }
.report-calendar-selects select { min-width: 0; width: 50%; padding: 8px 5px; border: 1px solid #dbe3ee; border-radius: 8px; background: white; color: #263750; font: inherit; }
.report-calendar-nav { width: 32px; height: 34px; border: 0; border-radius: 8px; background: #eef3fa; color: #294778; font-size: 23px; cursor: pointer; }
.report-calendar-grid { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 4px; text-align: center; }
.report-calendar-weekdays { margin-bottom: 5px; color: #7c899c; font-size: 12px; font-weight: 700; }
.report-calendar-weekdays span { padding: 5px 0; }
.report-calendar-day { height: 34px; border: 0; border-radius: 8px; background: transparent; color: #293c5a; cursor: pointer; font: inherit; }
.report-calendar-day:hover:not(:disabled) { background: #edf3fb; }
.report-calendar-day.today { box-shadow: inset 0 0 0 1px #9cb3d7; }
.report-calendar-day.selected { background: #294778; color: #fff; }
.report-calendar-day:disabled { color: #c4cad3; cursor: not-allowed; }
.report-calendar-footer { display: flex; justify-content: space-between; margin-top: 12px; padding-top: 10px; border-top: 1px solid #edf0f5; }
.report-calendar-clear, .report-calendar-close { border: 0; background: transparent; color: #294778; cursor: pointer; font: inherit; font-weight: 600; padding: 6px; }
@media print { .report-date-picker, .report-calendar-popover { display: none !important; } }

@page { size:A4; margin:12mm; }
}`;
