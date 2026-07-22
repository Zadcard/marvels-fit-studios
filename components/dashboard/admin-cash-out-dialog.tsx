"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BanknoteArrowDown } from "lucide-react";

import { recordStudioExpense } from "@/app/actions/admin-expenses";
import { EntityDialog, EntityForm, FormActions, FormField } from "@/components/ui/entity-form";
import { useDashboardToast } from "./dashboard-toast-provider";
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
  const { showToast } = useDashboardToast();
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

  return <>
    <button className="mv-btn mv-btn-secondary" type="button" onClick={() => { reset(); setOpen(true); }}><BanknoteArrowDown size={16} /> Record cash out</button>
    <EntityDialog open={open} onOpenChange={setOpen} title="Record cash out" description="Record an auditable operating expense in the studio ledger." closeLabel="Close cash out" size="small">
        {saved ? <div className={styles.confirmation}><strong>Cash out recorded</strong><p>The expense is posted to the studio ledger and included in reports.</p><button className="mv-btn mv-btn-primary" type="button" onClick={() => setOpen(false)}>Done</button></div> : <EntityForm onSubmit={(event) => {
          event.preventDefault();
          setError("");
          const data = new FormData(event.currentTarget);
          const occurredAt = new Date(String(data.get("occurredAt")));
          startTransition(async () => {
            try {
              await recordStudioExpense({
                amount: Number(data.get("amount")), currency: "EGP", category,
                paymentMethod: "CASH",
                description: String(data.get("description")),
                reference: String(data.get("reference") ?? ""),
                occurredAt: occurredAt.toISOString(),
              });
              setSaved(true);
              showToast("Cash out recorded.");
              router.refresh();
            } catch (cause) {
              const description = cause instanceof Error ? cause.message : "The expense could not be recorded.";
              setError(description);
              showToast(description, "warning");
            }
          });
        }}>
          <FormField label="Amount (EGP)" required full><input name="amount" type="number" inputMode="decimal" min="0.01" max="10000000" step="0.01" placeholder="0.00" required /></FormField>
          <FormField label="Category" full><span className={styles.chips}>{categories.map(([value, label]) => <button key={value} type="button" data-active={category === value || undefined} onClick={() => setCategory(value)}>{label}</button>)}</span></FormField>
          <FormField label="Occurred at" required full><input name="occurredAt" type="datetime-local" max={localDateTimeValue()} defaultValue={localDateTimeValue()} required /></FormField>
          <FormField label="Description" required full><textarea name="description" maxLength={300} placeholder="What was this payment for?" rows={3} required /></FormField>
          <FormField label="Receipt / reference" full><input name="reference" maxLength={120} placeholder="Optional paper receipt or transfer reference" /></FormField>
          {error ? <p className={styles.error} role="alert">{error}</p> : null}
          <FormActions onCancel={() => setOpen(false)} submitLabel="Record cash out" pendingLabel="Recording…" pending={pending} />
        </EntityForm>}
    </EntityDialog>
  </>;
}
