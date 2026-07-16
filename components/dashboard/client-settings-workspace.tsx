"use client";

import { useState, useTransition } from "react";
import {
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  LockKeyhole,
  Save,
  Target,
  UserRound,
} from "lucide-react";
import Link from "next/link";

import {
  clientSettingsOptions,
  type ClientSettingsRecord,
} from "@/lib/dashboard/client-dashboard-data";
import styles from "./client-settings-workspace.module.css";

type Props = {
  initialSettings: ClientSettingsRecord;
  saveSettingsAction?: (input: ClientSettingsRecord) => Promise<void>;
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function ClientSettingsWorkspace({
  initialSettings,
  saveSettingsAction,
}: Props) {
  const [settings, setSettings] =
    useState<ClientSettingsRecord>(initialSettings);
  const [savedSettings, setSavedSettings] =
    useState<ClientSettingsRecord>(initialSettings);
  const [message, setMessage] = useState("Your profile is synced.");
  const [pending, start] = useTransition();
  const hasChanges = JSON.stringify(settings) !== JSON.stringify(savedSettings);

  function update<Key extends keyof ClientSettingsRecord>(
    field: Key,
    value: ClientSettingsRecord[Key],
  ) {
    setSettings((current) => ({ ...current, [field]: value }));
  }

  function save() {
    setMessage("");
    start(async () => {
      try {
        await saveSettingsAction?.(settings);
        setSavedSettings(settings);
        setMessage("Profile changes saved.");
      } catch (caught) {
        setMessage(
          caught instanceof Error
            ? caught.message
            : "Could not save profile changes.",
        );
      }
    });
  }

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <div>
          <span className={styles.kicker}>My settings</span>
          <h1>Make the plan fit you.</h1>
          <p>
            Keep your identity, training intent and preferred session window
            accurate for every coach touchpoint.
          </p>
        </div>
        <button
          type="button"
          className="mv-btn mv-btn-primary"
          disabled={!hasChanges || pending}
          onClick={save}
        >
          <Save size={16} />
          {pending ? "Saving…" : "Save changes"}
        </button>
      </header>

      <section className={styles.identity}>
        <div className={styles.monogram}>
          {initials(settings.fullName) || "M"}
        </div>
        <div>
          <span className={styles.kicker}>Member identity</span>
          <h2>{settings.fullName || "Your name"}</h2>
          <p>{settings.email || "Add your email"}</p>
        </div>
        <span data-dirty={hasChanges || undefined}>
          {hasChanges ? "Unsaved edits" : "Profile synced"}
        </span>
      </section>

      <section className={styles.workspace}>
        <form
          className={styles.form}
          onSubmit={(event) => event.preventDefault()}
        >
          <header className={styles.sectionHead}>
            <div>
              <span className={styles.kicker}>Profile control</span>
              <h2>Personal details</h2>
            </div>
            <UserRound size={21} />
          </header>

          <div className={styles.fields}>
            <label>
              <span>Full name</span>
              <input
                autoComplete="name"
                value={settings.fullName}
                onChange={(event) => update("fullName", event.target.value)}
              />
            </label>
            <label>
              <span>Email</span>
              <input
                type="email"
                autoComplete="email"
                value={settings.email}
                onChange={(event) => update("email", event.target.value)}
              />
            </label>
            <label>
              <span>Phone</span>
              <input
                type="tel"
                autoComplete="tel"
                value={settings.phone}
                onChange={(event) => update("phone", event.target.value)}
              />
            </label>
            <label>
              <span>Preferred session window</span>
              <select
                value={settings.preferredSessionTime}
                onChange={(event) =>
                  update("preferredSessionTime", event.target.value)
                }
              >
                {clientSettingsOptions.preferredSessionTimes.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.goalField}>
              <span>What are you training for?</span>
              <textarea
                rows={5}
                value={settings.goalLabel}
                onChange={(event) => update("goalLabel", event.target.value)}
              />
              <small>
                This goal gives your coach context when planning sessions.
              </small>
            </label>
          </div>
        </form>

        <aside className={styles.context}>
          <article className={styles.goalCard}>
            <Target size={22} />
            <span>Current intent</span>
            <h2>{settings.goalLabel || "No goal written yet"}</h2>
            <p>Visible to the team supporting your training.</p>
          </article>

          <article className={styles.preferenceCard}>
            <Clock3 size={21} />
            <div>
              <span>Preferred window</span>
              <strong>{settings.preferredSessionTime}</strong>
            </div>
          </article>

          <article className={styles.statusCard}>
            <CheckCircle2 size={20} />
            <div>
              <span>Save state</span>
              <strong>
                {hasChanges
                  ? "Changes waiting to save."
                  : message || "Saving your changes…"}
              </strong>
            </div>
          </article>
        </aside>
      </section>

      <section className={styles.security}>
        <div className={styles.securityIcon}>
          <LockKeyhole />
        </div>
        <div>
          <span className={styles.kicker}>Secure access</span>
          <h2>Password and sign-in</h2>
          <p>
            Change your password on the protected account flow. Your profile
            edits here never expose credential data.
          </p>
        </div>
        <Link href="/change-password">
          Change password <ArrowUpRight size={16} />
        </Link>
      </section>
    </div>
  );
}
