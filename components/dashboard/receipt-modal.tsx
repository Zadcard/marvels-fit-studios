"use client";

import { useState } from "react";
import { Dialog } from "radix-ui";
import { Download, MessageCircle, X } from "lucide-react";
import { generateReceiptPDF, type ReceiptSnapshot } from "@/lib/receipts/pdf-generator";
import styles from "./receipt-modal.module.css";

export type ReceiptModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receipt: ReceiptSnapshot | null;
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

export function ReceiptModal({ open, onOpenChange, receipt }: ReceiptModalProps) {
  const [error, setError] = useState<string | null>(null);

  if (!receipt) return null;

  function handleDownloadPDF() {
    if (!receipt) return;
    setError(null);
    try {
      generateReceiptPDF(receipt);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to download PDF receipt.";
      setError(msg);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className={styles.overlay} />
        <Dialog.Content className={styles.modal} aria-describedby="receipt-modal-description">
          <Dialog.Close className={styles.close} aria-label="Close receipt modal">
            <X size={16} />
          </Dialog.Close>

          <header className={styles.header}>
            <span className={styles.brand}>MARVEL FITNESS STUDIO</span>
            <div className={styles.titleRow}>
              <Dialog.Title asChild>
                <h2>Receipt {receipt.receiptNumber}</h2>
              </Dialog.Title>
              <span className={styles.statusPill}>{receipt.paymentStatus || "PAID"}</span>
            </div>
            <p id="receipt-modal-description" style={{ display: "none" }}>
              Official payment receipt snapshot for {receipt.clientName}.
            </p>
          </header>

          <div className={styles.grid}>
            {/* Client Section */}
            <div className={styles.section}>
              <h3>Client Information</h3>
              <dl className={styles.dataList}>
                <div className={styles.dataRow}>
                  <dt>Client</dt>
                  <dd>{receipt.clientName}</dd>
                </div>
                <div className={styles.dataRow}>
                  <dt>Phone</dt>
                  <dd>{receipt.clientPhone || "Not recorded"}</dd>
                </div>
                <div className={styles.dataRow}>
                  <dt>Group</dt>
                  <dd>{receipt.groupName || "No group"}</dd>
                </div>
                <div className={styles.dataRow}>
                  <dt>Coach</dt>
                  <dd>{receipt.coachName || "Unassigned"}</dd>
                </div>
              </dl>
            </div>

            {/* Payment Info Section */}
            <div className={styles.section}>
              <h3>Payment &amp; Transaction</h3>
              <dl className={styles.dataList}>
                <div className={styles.dataRow}>
                  <dt>Receipt No.</dt>
                  <dd>{receipt.receiptNumber}</dd>
                </div>
                <div className={styles.dataRow}>
                  <dt>Payment Date</dt>
                  <dd>{formatDate(receipt.paymentDate)}</dd>
                </div>
                <div className={styles.dataRow}>
                  <dt>Payment Method</dt>
                  <dd>{receipt.paymentMethod}</dd>
                </div>
                <div className={styles.dataRow}>
                  <dt>Recorded By</dt>
                  <dd>{receipt.createdByName || "System"}</dd>
                </div>
              </dl>
            </div>

            {/* Subscription & Plan Section */}
            <div className={styles.sectionFull}>
              <h3>Subscription &amp; Plan Details</h3>
              <dl className={styles.dataList}>
                <div className={styles.dataRow}>
                  <dt>Plan Name</dt>
                  <dd>{receipt.planName}</dd>
                </div>
                <div className={styles.dataRow}>
                  <dt>Billing &amp; Duration</dt>
                  <dd>
                    {receipt.durationMonths} {receipt.durationMonths === 1 ? "Month" : "Months"} ({receipt.billingCycle})
                  </dd>
                </div>
                <div className={styles.dataRow}>
                  <dt>Session Allowance</dt>
                  <dd>{receipt.sessionsIncluded} Sessions</dd>
                </div>
                <div className={styles.dataRow}>
                  <dt>Subscription Window</dt>
                  <dd>
                    {formatDate(receipt.startsAt)} — {formatDate(receipt.endsAt)}
                  </dd>
                </div>
                {receipt.note ? (
                  <div className={styles.dataRow}>
                    <dt>Notes</dt>
                    <dd>{receipt.note}</dd>
                  </div>
                ) : null}
              </dl>
            </div>
          </div>

          {/* Amount Paid Summary Box */}
          <div className={styles.amountBox}>
            <span>Amount Paid</span>
            <strong>{formatCurrency(receipt.amount, receipt.currency)}</strong>
          </div>

          {error ? <div className={styles.errorBanner}>{error}</div> : null}

          <footer className={styles.footer}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={() => onOpenChange(false)}
            >
              Close
            </button>
            <button
              type="button"
              className={styles.downloadBtn}
              onClick={handleDownloadPDF}
            >
              <Download size={15} /> Download PDF
            </button>
            <button
              type="button"
              className={styles.whatsappComingSoonBtn}
              disabled
              aria-disabled="true"
              title="Automatic WhatsApp delivery coming soon"
            >
              <MessageCircle size={15} /> Send via WhatsApp
              <span className={styles.comingSoonBadge}>Coming soon</span>
            </button>
          </footer>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
