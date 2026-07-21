"use client";

import { Check, LoaderCircle, Save } from "lucide-react";
import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import { saveAdminSettings } from "@/app/actions/admin-settings";
import {
  adminStudioSettingOptions,
  type AdminStudioSettings,
} from "@/lib/mocks/admin-settings";

import styles from "./admin-settings-workspace.module.css";

export function AdminSettingsWorkspace({
  settings,
}: {
  settings: AdminStudioSettings;
}) {
  const router = useRouter();
  const [form, setForm] = useState(settings);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const update = <Key extends keyof AdminStudioSettings>(
    key: Key,
    value: AdminStudioSettings[Key],
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
    setMessage("");
  };

  const submit = () => {
    setError("");
    startTransition(async () => {
      try {
        await saveAdminSettings(form);
        setMessage("Studio settings saved.");
        router.refresh();
      } catch (reason) {
        setError(
          reason instanceof Error
            ? reason.message
            : "Settings could not be saved.",
        );
      }
    });
  };

  return (
    <form
      className={styles.page}
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
      aria-busy={pending}
    >
      <section className={styles.panel}>
        <header>
          <div>
            <span>Studio</span>
            <h2>Studio details</h2>
            <p>Core information used across the operations workspace.</p>
          </div>
        </header>
        <div className={styles.fields}>
          <Field label="Studio name"><input value={form.studioName} onChange={(event) => update("studioName", event.target.value)} /></Field>
          <Field label="Timezone"><input value={form.timezone} onChange={(event) => update("timezone", event.target.value)} /></Field>
          <Field label="Support email"><input type="email" value={form.supportEmail} onChange={(event) => update("supportEmail", event.target.value)} /></Field>
          <Field label="Support phone"><input type="tel" placeholder="+20 100 000 0000" value={form.supportPhone} onChange={(event) => update("supportPhone", event.target.value)} /></Field>
        </div>
      </section>

      <section className={styles.panel}>
        <header>
          <div>
            <span>Operations</span>
            <h2>Daily rhythm</h2>
            <p>Defaults for sessions, private coaching, and new intake.</p>
          </div>
        </header>
        <div className={styles.fields}>
          <Field label="Default session length"><select value={form.defaultSessionLength} onChange={(event) => update("defaultSessionLength", event.target.value)}>{adminStudioSettingOptions.sessionLengths.map((option) => <option key={option}>{option}</option>)}</select></Field>
          <Field label="Intake lead time"><select value={form.intakeLeadTime} onChange={(event) => update("intakeLeadTime", event.target.value)}>{adminStudioSettingOptions.intakeLeadTimes.map((option) => <option key={option}>{option}</option>)}</select></Field>
          <Field label="Private session buffer"><select value={form.privateSessionBuffer} onChange={(event) => update("privateSessionBuffer", event.target.value)}>{adminStudioSettingOptions.privateSessionBuffers.map((option) => <option key={option}>{option}</option>)}</select></Field>
        </div>
      </section>

      <section className={styles.panel}>
        <header>
          <div>
            <span>Booking</span>
            <h2>Calendar controls</h2>
            <p>Keep the weekly schedule and waitlist behavior predictable.</p>
          </div>
        </header>
        <div className={styles.fields}>
          <Field label="Cancellation window"><select value={form.cancellationWindow} onChange={(event) => update("cancellationWindow", event.target.value)}>{adminStudioSettingOptions.cancellationWindows.map((option) => <option key={option}>{option}</option>)}</select></Field>
          <Field label="Schedule starts"><select value={form.scheduleStartDay} onChange={(event) => update("scheduleStartDay", event.target.value)}>{adminStudioSettingOptions.scheduleStartDays.map((option) => <option key={option}>{option}</option>)}</select></Field>
          <label className={styles.switchCard}>
            <span><b>Overbook waitlist</b><small>Allow a waitlisted client to fill a released place automatically.</small></span>
            <input type="checkbox" checked={form.overbookWaitlist} onChange={(event) => update("overbookWaitlist", event.target.checked)} />
            <i aria-hidden="true" />
          </label>
        </div>
      </section>

      {error ? <p className={styles.error} role="alert">{error}</p> : null}
      <footer className={styles.footer}>
        <span aria-live="polite">{message ? <><Check size={14} /> {message}</> : "Changes apply to future operations."}</span>
        <button type="submit" disabled={pending}>{pending ? <><LoaderCircle size={15} className={styles.spinner} /> Saving</> : <><Save size={15} /> Save changes</>}</button>
      </footer>
    </form>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className={styles.field}><span>{label}</span>{children}</label>;
}
