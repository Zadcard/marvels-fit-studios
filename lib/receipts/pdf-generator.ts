import { jsPDF } from "jspdf";

import { formatPhoneNumber } from "@/lib/phone-format";

export type ReceiptSnapshot = {
  id?: string;
  receiptNumber: string;
  clientId?: string | null;
  clientName: string;
  clientPhone?: string | null;
  subscriptionId?: string | null;
  paymentId?: string | null;
  amount: number;
  currency: string;
  paymentMethod: string;
  paymentDate: string;
  planName: string;
  planType: string;
  billingCycle: string;
  durationMonths: number;
  sessionsIncluded: number;
  startsAt?: string | null;
  endsAt?: string | null;
  coachId?: string | null;
  coachName?: string | null;
  groupId?: string | null;
  groupName?: string | null;
  createdById?: string | null;
  createdByName?: string | null;
  createdAt?: string | null;
  paymentStatus: string;
  note?: string | null;
};

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr;
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(d);
  } catch {
    return dateStr;
  }
}

function formatCurrency(amount: number, currency = "EGP"): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount}`;
  }
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9_-]/g, "_").replace(/_+/g, "_");
}

export function generateReceiptPDF(snapshot: ReceiptSnapshot): void {
  try {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    let y = 15;

    // Header Banner
    doc.setFillColor(230, 36, 41); // #E62429 Marvel Red
    doc.rect(0, 0, pageWidth, 24, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("MARVEL FITNESS STUDIO", margin, 12);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("OFFICIAL PAYMENT RECEIPT", margin, 18);

    doc.text(snapshot.receiptNumber, pageWidth - margin, 15, { align: "right" });

    y = 35;

    // Title / Status Badge Row
    doc.setTextColor(23, 23, 23);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Payment Receipt", margin, y);

    // Status badge
    doc.setFillColor(37, 211, 102); // Green
    doc.roundedRect(pageWidth - margin - 24, y - 5, 24, 7, 1.5, 1.5, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text(snapshot.paymentStatus || "PAID", pageWidth - margin - 12, y - 0.5, { align: "center" });

    y += 10;

    // Summary Cards (2 Grid Columns)
    const cardWidth = (pageWidth - margin * 2 - 10) / 2;

    // Client Info Box
    doc.setFillColor(248, 249, 250);
    doc.setDrawColor(220, 224, 230);
    doc.roundedRect(margin, y, cardWidth, 42, 2, 2, "FD");

    doc.setTextColor(120, 120, 120);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("CLIENT INFORMATION", margin + 6, y + 8);

    doc.setTextColor(23, 23, 23);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(snapshot.clientName, margin + 6, y + 15);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(80, 80, 80);
    doc.text(`Phone: ${formatPhoneNumber(snapshot.clientPhone, "Not recorded")}`, margin + 6, y + 22);
    doc.text(`Group: ${snapshot.groupName || "No group"}`, margin + 6, y + 28);
    doc.text(`Coach: ${snapshot.coachName || "Unassigned"}`, margin + 6, y + 34);

    // Payment Info Box
    const rightBoxX = margin + cardWidth + 10;
    doc.setFillColor(248, 249, 250);
    doc.roundedRect(rightBoxX, y, cardWidth, 42, 2, 2, "FD");

    doc.setTextColor(120, 120, 120);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("TRANSACTION DETAILS", rightBoxX + 6, y + 8);

    doc.setTextColor(23, 23, 23);
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.text(`Receipt No: ${snapshot.receiptNumber}`, rightBoxX + 6, y + 15);
    doc.text(`Date: ${formatDate(snapshot.paymentDate)}`, rightBoxX + 6, y + 22);
    doc.text(`Method: ${snapshot.paymentMethod}`, rightBoxX + 6, y + 28);
    doc.text(`Recorded By: ${snapshot.createdByName || "System"}`, rightBoxX + 6, y + 34);

    y += 50;

    // Subscription & Plan Table Header
    doc.setFillColor(230, 36, 41);
    doc.rect(margin, y, pageWidth - margin * 2, 8, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.text("DESCRIPTION / PLAN", margin + 6, y + 5.5);
    doc.text("CYCLE / DURATION", margin + 85, y + 5.5);
    doc.text("SESSIONS", margin + 130, y + 5.5);
    doc.text("AMOUNT", pageWidth - margin - 6, y + 5.5, { align: "right" });

    y += 8;

    // Table Content Row
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(220, 224, 230);
    doc.rect(margin, y, pageWidth - margin * 2, 16, "D");

    doc.setTextColor(23, 23, 23);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(snapshot.planName, margin + 6, y + 6);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(
      `Period: ${formatDate(snapshot.startsAt)} - ${formatDate(snapshot.endsAt)}`,
      margin + 6,
      y + 11
    );

    doc.setTextColor(23, 23, 23);
    doc.text(
      `${snapshot.durationMonths} ${snapshot.durationMonths === 1 ? "Month" : "Months"} (${snapshot.billingCycle})`,
      margin + 85,
      y + 8.5
    );
    doc.text(`${snapshot.sessionsIncluded} Sessions`, margin + 130, y + 8.5);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.text(formatCurrency(snapshot.amount, snapshot.currency), pageWidth - margin - 6, y + 8.5, {
      align: "right",
    });

    y += 24;

    // Total Amount Box
    const totalBoxWidth = 80;
    const totalBoxX = pageWidth - margin - totalBoxWidth;

    doc.setFillColor(245, 247, 250);
    doc.roundedRect(totalBoxX, y, totalBoxWidth, 18, 2, 2, "FD");

    doc.setTextColor(100, 100, 100);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("TOTAL AMOUNT PAID", totalBoxX + 6, y + 7);

    doc.setTextColor(230, 36, 41);
    doc.setFontSize(13);
    doc.text(formatCurrency(snapshot.amount, snapshot.currency), totalBoxX + 6, y + 14);

    y += 28;

    // Note Section if available
    if (snapshot.note) {
      doc.setTextColor(120, 120, 120);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.text("NOTES", margin, y);

      y += 4;
      doc.setTextColor(60, 60, 60);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.text(snapshot.note, margin, y);

      y += 12;
    }

    // Footer
    const footerY = 270;
    doc.setDrawColor(220, 224, 230);
    doc.line(margin, footerY, pageWidth - margin, footerY);

    doc.setTextColor(130, 130, 130);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(
      "Marvel Fitness Studio · Operational System Record · Thank you for your business!",
      pageWidth / 2,
      footerY + 6,
      { align: "center" }
    );

    const safeClient = sanitizeFilename(snapshot.clientName || "Client");
    const safeNum = sanitizeFilename(snapshot.receiptNumber);
    const filename = `Receipt-${safeNum}-${safeClient}.pdf`;

    doc.save(filename);
  } catch (error) {
    console.error("Failed to generate PDF receipt:", error);
    throw new Error(
      error instanceof Error
        ? `PDF generation failed: ${error.message}`
        : "Failed to generate receipt PDF."
    );
  }
}
