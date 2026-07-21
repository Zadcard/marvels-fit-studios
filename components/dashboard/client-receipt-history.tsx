"use client";

import { useState } from "react";
import { Download, ReceiptText } from "lucide-react";
import { generateReceiptPDF, type ReceiptSnapshot } from "@/lib/receipts/pdf-generator";
import { ReceiptModal } from "./receipt-modal";
import styles from "./client-receipt-history.module.css";

export type ClientReceiptHistoryProps = {
  clientName: string;
  receipts: ReceiptSnapshot[];
};

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

export function ClientReceiptHistory({ clientName, receipts }: ClientReceiptHistoryProps) {
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptSnapshot | null>(null);

  // Sort newest to oldest
  const sorted = [...receipts].sort((a, b) => {
    const dateA = new Date(a.paymentDate || a.createdAt || 0).getTime();
    const dateB = new Date(b.paymentDate || b.createdAt || 0).getTime();
    return dateB - dateA;
  });

  function handleDownload(e: React.MouseEvent, receipt: ReceiptSnapshot) {
    e.stopPropagation();
    generateReceiptPDF(receipt);
  }

  return (
    <section className={styles.section}>
      <h3>Receipts &amp; Payment History</h3>

      {sorted.length === 0 ? (
        <div className={styles.emptyState}>
          <ReceiptText size={16} />
          <span>No receipts recorded for {clientName} yet.</span>
        </div>
      ) : (
        <div className={styles.list}>
          {sorted.map((receipt) => (
            <article key={receipt.receiptNumber || receipt.id} className={styles.card}>
              <div className={styles.info}>
                <span className={styles.number}>{receipt.receiptNumber}</span>
                <span className={styles.meta}>
                  {formatDate(receipt.paymentDate)} · {receipt.paymentMethod} · {receipt.planName}
                </span>
              </div>
              <div className={styles.actions}>
                <span className={styles.amount}>
                  {formatCurrency(receipt.amount, receipt.currency)}
                </span>
                <button
                  type="button"
                  className={styles.viewBtn}
                  onClick={() => setSelectedReceipt(receipt)}
                >
                  <ReceiptText size={13} /> Receipt
                </button>
                <button
                  type="button"
                  className={styles.downloadBtn}
                  onClick={(e) => handleDownload(e, receipt)}
                  title="Download PDF"
                  aria-label={`Download PDF for receipt ${receipt.receiptNumber}`}
                >
                  <Download size={13} />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      <ReceiptModal
        open={!!selectedReceipt}
        onOpenChange={(open) => !open && setSelectedReceipt(null)}
        receipt={selectedReceipt}
      />
    </section>
  );
}
