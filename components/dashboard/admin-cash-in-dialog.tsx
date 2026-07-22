"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BanknoteArrowUp } from "lucide-react";

import { recordCashIn } from "@/app/actions/admin-payments";
import { EntityDialog, EntityForm, FormActions, FormField } from "@/components/ui/entity-form";
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
  const [sourceType, setSourceType] = useState<"client" | "other">("client");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function reset() {
    setSaved(false);
    setError("");
    setMethod("Cash");
    setSourceType("client");
  }

  return <>
    <button className="mv-btn mv-btn-primary" type="button" onClick={() => { reset(); setOpen(true); }}><BanknoteArrowUp size={16} /> Record cash in</button>
    <EntityDialog open={open} onOpenChange={setOpen} title="Record cash in" description="Record client income or money received from another source." closeLabel="Close cash in" size="small">
        {saved ? <div className={styles.confirmation}><strong>Cash in recorded</strong><p>The income is included in Today and Reports.</p><button className="mv-btn mv-btn-primary" type="button" onClick={() => setOpen(false)}>Done</button></div> : <EntityForm onSubmit={(event) => {
          event.preventDefault();
          setError("");
          const data = new FormData(event.currentTarget);
          const occurredAt = new Date(String(data.get("occurredAt")));
          startTransition(async () => {
            try {
              await recordCashIn({
                sourceType,
                clientId: sourceType === "client" ? String(data.get("clientId") ?? "") : undefined,
                sourceLabel: sourceType === "other" ? String(data.get("sourceLabel") ?? "") : undefined,
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
          <FormField label="Cash source" full><select value={sourceType} onChange={(event) => setSourceType(event.target.value as "client" | "other")}><option value="client">Client</option><option value="other">Other</option></select></FormField>
          {sourceType === "client" ? <FormField label="Client" required full><select name="clientId" required defaultValue=""><option value="" disabled>Select a client</option>{clientOptions.map((client) => <option key={client.id} value={client.id}>{client.fullName}</option>)}</select></FormField> : <FormField label="Where did it come from?" required full><input name="sourceLabel" minLength={2} maxLength={120} placeholder="e.g. Equipment rental" required /></FormField>}
          <FormField label="Amount (EGP)" required full><input name="amount" type="number" inputMode="decimal" min="0.01" max="10000000" step="0.01" placeholder="0.00" required /></FormField>
          <FormField label="Paid with" full><span className={styles.chips}>{methods.map((option) => <button key={option} type="button" data-active={method === option || undefined} onClick={() => setMethod(option)}>{option}</button>)}</span></FormField>
          <FormField label="Occurred at" required full><input name="occurredAt" type="datetime-local" max={localDateTimeValue()} defaultValue={localDateTimeValue()} required /></FormField>
          <FormField label="Note" full><input name="note" maxLength={300} placeholder="What is this income for?" /></FormField>
          {error ? <p className={styles.error} role="alert">{error}</p> : null}
          <FormActions onCancel={() => setOpen(false)} submitLabel="Record cash in" pendingLabel="Recording…" pending={pending} />
        </EntityForm>}
    </EntityDialog>
  </>;
}
