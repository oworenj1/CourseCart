// PDF export uses the same report totals and stock rules shown on the Reports screen.
import { jsPDF } from "jspdf";
import { formatAmount } from "./formatters";
import { isLowStock } from "./stock";

// Creates and downloads the Reports & Analytics PDF.
// `report` is the object returned by buildSalesReport().
export const downloadReportPdf = ({ report, startDate, endDate }) => {
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 16;
  const usableWidth = pageWidth - margin * 2;
  let y = 18;

  const addLine = (text, options = {}) => {
    const { size = 10, bold = false, gap = 6 } = options;
    pdf.setFont("helvetica", bold ? "bold" : "normal");
    pdf.setFontSize(size);
    const lines = pdf.splitTextToSize(String(text), usableWidth);
    if (y + lines.length * (size * 0.45) + gap > pageHeight - margin) {
      pdf.addPage();
      y = margin;
    }
    pdf.text(lines, margin, y);
    y += lines.length * (size * 0.45) + gap;
  };

  const money = (value) => "PHP " + formatAmount(value);
  const period =
    startDate || endDate
      ? `${startDate || "All dates"} to ${endDate || "Present"}`
      : "All recorded dates";

  const {
    filteredSales,
    revenue,
    discounts,
    unitsSold,
    rankedProducts,
    activeProducts,
    lowStock,
    totalStock,
  } = report;

  addLine("CourseCart", { size: 19, bold: true, gap: 3 });
  addLine("Reports & Analytics", { size: 14, bold: true, gap: 3 });
  addLine(`Report period: ${period}`);
  addLine(`Generated: ${new Date().toLocaleString()}`, { gap: 10 });

  addLine("SALES SUMMARY", { size: 12, bold: true, gap: 4 });
  addLine(`Total sales: ${money(revenue)}`);
  addLine(`Completed transactions: ${filteredSales.length}`);
  addLine(`Units sold: ${unitsSold}`);
  addLine(`Discounts: ${money(discounts)}`, { gap: 10 });

  addLine("BEST-SELLING PRODUCTS", { size: 12, bold: true, gap: 4 });
  if (!rankedProducts.length)
    addLine("No completed sales in the selected period.");
  rankedProducts.forEach((item, index) =>
    addLine(
      `${index + 1}. ${item.name} — ${item.quantity} units — ${money(item.revenue)}`,
    ),
  );
  y += 4;

  addLine("CURRENT INVENTORY", { size: 12, bold: true, gap: 4 });
  addLine(`Active products: ${activeProducts.length}`);
  addLine(`Total units in stock: ${totalStock}`);
  addLine(`Low-stock items: ${lowStock.length}`, { gap: 4 });
  if (!activeProducts.length) addLine("No active products.");
  else
    activeProducts.forEach((product) =>
      addLine(
        `${product.name || "Unnamed product"} — Stock: ${Number(product.stock) || 0}${isLowStock(product) ? " (LOW STOCK)" : ""}`,
        { size: 9, gap: 4 },
      ),
    );

  const filenameDate = new Date().toISOString().slice(0, 10);
  pdf.save(`CourseCart-Report-${filenameDate}.pdf`);
};
