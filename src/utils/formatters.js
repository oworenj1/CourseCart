// Formats a number like 1,234.50 (Philippine locale, always 2 decimals).
export const formatAmount = (value) =>
  Number(value || 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
