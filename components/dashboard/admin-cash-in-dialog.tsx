"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "radix-ui";
import { BanknoteArrowUp, X } from "lucide-react";

import { recordCashIn } from "@/app/actions/admin-payments";
import { useDashboardToast } from "./dashboard-toast-provider";
import styles from "./admin-cash-out-dialog.module.css";

const methods = ["Cash", "Visa", "InstaPay"] as const;

function localDateTimeValue(date = new Date()) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

export function AdminCashInDialog({
  clientOptions,
}: {
  clientOptions: Array<{ id: string; fullName: string }>;
}) {
  const router = useRouter();
  const { showToast } = useDashboardToast();
  const [open, setOpen] = useState(false);
  const [method, setMethod] = useState<(typeof methods)[number]>("Cash");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function reset() {
    setSaved(false);
    setError("");
    setMethod("Cash");
  }

  return <Dialog.Root open={open} onOpenChange={(next) => { setOpen(next); if (next) reset(); }}>
    <Dialog.Trigger asChild><button className={styles.trigger} type="button">+ Record cash in</button></Dialog.Trigger>
    <Dialog.Portal>
      <Dialog.Overlay className={styles.overlay} />
      <Dialog.Content className={styles.content}>
        <header><span><BanknoteArrowUp size={18} /><Dialog.Title>Record cash in</Dialog.Title></span><Dialog.Close asChild><button type="button" aria-label="Close cash in"><X size={18} /></button></Dialog.Close></header>
        <Dialog.Description className="sr-only">Record money received from a client.</Dialog.Description>
        {saved ? <div className={styles.confirmation}><strong>Cash in recorded</strong><p>The payment is posted to the ledger and included in reports.</p><Dialog.Close asChild><button type="button">Done</button></Dialog.Close></div> : <form onSubmit={(event) => {
          event.preventDefault();
          setError("");
          const data = new FormData(event.currentTarget);
          const occurredAt = new Date(String(data.get("occurredAt")));
          startTransition(async () => {
            try {
              await recordCashIn({
                clientId: String(data.get("clientId") ?? ""),
                amount: Number(data.get("amount")),
                method,
                note: String(data.get("note") ?? ""),
                occurredAt: occurredAt.toISOString(),
              });
              setSaved(true);
              showToast("Cash in recorded.");
              router.refresh();
            } catch (cause) {
              const description = cause instanceof Error ? cause.message : "The cash in could not be recorded.";
              setError(description);
              showToast(description, "warning");
            }
          });
        }}>
          <label>Client<select name="clientId" required defaultValue=""><option value="" disabled>Select a client</option>{clientOptions.map((client) => <option key={client.id} value={client.id}>{client.fullName}</option>)}</select></label>
          <label>Amount (EGP)<input name="amount" type="number" inputMode="decimal" min="0.01" max="10000000" step="0.01" placeholder="0.00" required /></label>
          <label>Paid with <span className={styles.chips}>{methods.map((option) => <button key={option} type="button" data-active={method === option || undefined} onClick={() => setMethod(option)}>{option}</button>)}</span></label>
          <label>Occurred at<input name="occurredAt" type="datetime-local" max={localDateTimeValue()} defaultValue={localDateTimeValue()} required /></label>
          <label>Note<input name="note" maxLength={300} placeholder="What is this payment for?" /></label>
          {error ? <p className={styles.error} role="alert">{error}</p> : null}
          <button className={styles.submit} type="submit" disabled={pending}>{pending ? "Recording..." : "Record cash in"}</button>
        </form>}
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
