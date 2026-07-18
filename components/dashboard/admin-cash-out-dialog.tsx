"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "radix-ui";
import { BanknoteArrowDown, X } from "lucide-react";

import { recordStudioExpense } from "@/app/actions/admin-expenses";
import styles from "./admin-cash-out-dialog.module.css";

const categories = [
  ["SUPPLIES", "Supplies"], ["MAINTENANCE", "Maintenance"],
  ["COACH_PAYMENT", "Coach payment"], ["RENT_UTILITIES", "Rent & utilities"],
  ["MARKETING", "Marketing"], ["OTHER", "Other"],
] as const;

function localDateTimeValue(date = new Date()) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

export function AdminCashOutDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<(typeof categories)[number][0]>("SUPPLIES");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function reset() {
    setSaved(false);
    setError("");
    setCategory("SUPPLIES");
  }

  return <Dialog.Root open={open} onOpenChange={(next) => { setOpen(next); if (next) reset(); }}>
    <Dialog.Trigger asChild><button className={styles.trigger} type="button">+ Record cash out</button></Dialog.Trigger>
    <Dialog.Portal>
      <Dialog.Overlay className={styles.overlay} />
      <Dialog.Content className={styles.content}>
        <header><span><BanknoteArrowDown size={18} /><Dialog.Title>Record cash out</Dialog.Title></span><Dialog.Close asChild><button type="button" aria-label="Close cash out"><X size={18} /></button></Dialog.Close></header>
        <Dialog.Description className="sr-only">Record an auditable operating expense in the studio ledger.</Dialog.Description>
        {saved ? <div className={styles.confirmation}><strong>Cash out recorded</strong><p>The expense is posted to the studio ledger and included in reports.</p><Dialog.Close asChild><button type="button">Done</button></Dialog.Close></div> : <form onSubmit={(event) => {
          event.preventDefault();
          setError("");
          const data = new FormData(event.currentTarget);
          const occurredAt = new Date(String(data.get("occurredAt")));
          startTransition(async () => {
            try {
              await recordStudioExpense({
                amount: Number(data.get("amount")), currency: "EGP", category,
                paymentMethod: String(data.get("paymentMethod")) as "CASH" | "CARD" | "BANK_TRANSFER" | "INSTAPAY",
                description: String(data.get("description")),
                reference: String(data.get("reference") ?? ""),
                occurredAt: occurredAt.toISOString(),
              });
              setSaved(true);
              router.refresh();
            } catch (cause) {
              setError(cause instanceof Error ? cause.message : "The expense could not be recorded.");
            }
          });
        }}>
          <label>Amount (EGP)<input name="amount" type="number" inputMode="decimal" min="0.01" max="10000000" step="0.01" placeholder="0.00" required /></label>
          <label>Category <span className={styles.chips}>{categories.map(([value, label]) => <button key={value} type="button" data-active={category === value || undefined} onClick={() => setCategory(value)}>{label}</button>)}</span></label>
          <label>Payment method<select name="paymentMethod" defaultValue="CASH"><option value="CASH">Cash</option><option value="CARD">Card</option><option value="BANK_TRANSFER">Bank transfer</option><option value="INSTAPAY">InstaPay</option></select></label>
          <label>Occurred at<input name="occurredAt" type="datetime-local" max={localDateTimeValue()} defaultValue={localDateTimeValue()} required /></label>
          <label>Description<textarea name="description" maxLength={300} placeholder="What was this payment for?" rows={3} required /></label>
          <label>Receipt / reference<input name="reference" maxLength={120} placeholder="Optional paper receipt or transfer reference" /></label>
          {error ? <p className={styles.error} role="alert">{error}</p> : null}
          <button className={styles.submit} type="submit" disabled={pending}>{pending ? "Recording..." : "Record cash out"}</button>
        </form>}
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
