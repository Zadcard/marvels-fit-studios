"use client";

import { Save, UserRoundCog } from "lucide-react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  saveCoachSettings,
  type SaveCoachSettingsInput,
} from "@/app/actions/coach-settings";
import type { CoachSettingsRecord } from "@/lib/mocks/coach-settings";
import styles from "./coach-settings-workspace.module.css";

const specializations: SaveCoachSettingsInput["specialization"][] = [
  "Strength", "Conditioning", "Mobility", "Private Coaching", "Football",
  "Tennis", "Calisthenics", "Rehab", "Athletic Performance", "General Fitness",
];

export function CoachSettingsWorkspace({ settings }: { settings: CoachSettingsRecord }) {
  const router = useRouter();
  const [form, setForm] = useState<SaveCoachSettingsInput>({
    fullName: settings.fullName,
    email: settings.email,
    phone: settings.phone === "No phone" ? "" : settings.phone,
    specialization: specializations.includes(settings.specialization as SaveCoachSettingsInput["specialization"])
      ? settings.specialization as SaveCoachSettingsInput["specialization"]
      : "Strength",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function update<K extends keyof SaveCoachSettingsInput>(key: K, value: SaveCoachSettingsInput[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  return <section className={styles.workspace}>
    <header><span><UserRoundCog size={22} /></span><div><small>COACH PROFILE</small><h2>Account &amp; coaching details</h2><p>These fields update your staff account and the profile administrators see.</p></div></header>
    <form onSubmit={(event) => {
      event.preventDefault();
      setMessage("");
      setError("");
      startTransition(async () => {
        try {
          await saveCoachSettings(form);
          setMessage("Coach profile saved.");
          router.refresh();
        } catch (cause) {
          setError(cause instanceof Error ? cause.message : "The coach profile could not be saved.");
        }
      });
    }}>
      <label>Full name<input required maxLength={120} value={form.fullName} onChange={(event) => update("fullName", event.target.value)} /></label>
      <label>Email<input required type="email" value={form.email} onChange={(event) => update("email", event.target.value)} /></label>
      <label>Phone<input type="tel" maxLength={30} placeholder="+20 100 000 0000" value={form.phone} onChange={(event) => update("phone", event.target.value)} /></label>
      <label>Specialization<select value={form.specialization} onChange={(event) => update("specialization", event.target.value as SaveCoachSettingsInput["specialization"])}>{specializations.map((specialization) => <option key={specialization}>{specialization}</option>)}</select></label>
      {error ? <p className={styles.error} role="alert">{error}</p> : null}
      {message ? <p className={styles.success} role="status">{message}</p> : null}
      <footer><span>Changes are applied to your live coach profile.</span><button type="submit" disabled={pending}><Save size={15} /> {pending ? "Saving..." : "Save profile"}</button></footer>
    </form>
  </section>;
}
