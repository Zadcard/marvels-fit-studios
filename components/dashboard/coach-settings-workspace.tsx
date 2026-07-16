"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  ArrowRight,
  CheckCircle2,
  KeyRound,
  Mail,
  Phone,
  Save,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { saveCoachSettings } from "@/app/actions/coach-settings";
import type { CoachSettingsRecord } from "@/lib/mocks/coach-settings";
import styles from "./coach-settings-workspace.module.css";

type CoachSettingsWorkspaceProps = {
  initialSettings?: CoachSettingsRecord | null;
};

const specializationOptions = [
  "Strength",
  "Conditioning",
  "Mobility",
  "Private Coaching",
];

const emptyCoachSettings: CoachSettingsRecord = {
  fullName: "Coach",
  roleLabel: "Coach",
  email: "",
  phone: "",
  bio: "",
  specialization: "Strength",
  preferredView: "Sessions list",
  reminderLeadTime: "30 minutes",
  availabilityNote: "",
  mobileAlerts: false,
  clientCheckIns: false,
  waitlistFlags: false,
};

export function CoachSettingsWorkspace({
  initialSettings,
}: CoachSettingsWorkspaceProps) {
  const initialValue = initialSettings ?? emptyCoachSettings;
  const [settings, setSettings] = useState(initialValue);
  const [savedSettings, setSavedSettings] = useState(initialValue);
  const [message, setMessage] = useState("Profile is up to date.");
  const [saving, startSaving] = useTransition();
  const changed = JSON.stringify(settings) !== JSON.stringify(savedSettings);
  const initials =
    settings.fullName
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "CO";

  function update<Key extends keyof CoachSettingsRecord>(
    key: Key,
    value: CoachSettingsRecord[Key],
  ) {
    setSettings((current) => ({ ...current, [key]: value }));
    setMessage("Unsaved identity changes.");
  }

  function save() {
    startSaving(async () => {
      try {
        await saveCoachSettings({
          fullName: settings.fullName,
          email: settings.email,
          phone: settings.phone,
          specialization: settings.specialization,
        });
        setSavedSettings(settings);
        setMessage("Coach identity saved.");
      } catch (caught) {
        setMessage(
          caught instanceof Error ? caught.message : "Could not save settings.",
        );
      }
    });
  }

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <div>
          <span className={styles.kicker}>Coach settings</span>
          <h1>Shape your coaching identity.</h1>
          <p>
            Keep the contact details and specialty seen by the studio team
            accurate and ready for every assignment.
          </p>
        </div>
        <button
          type="button"
          className="mv-btn mv-btn-primary"
          disabled={!changed || saving}
          onClick={save}
        >
          <Save size={17} /> {saving ? "Saving…" : "Save identity"}
        </button>
      </header>

      <section className={styles.identityStrip}>
        <span className={styles.avatar}>{initials}</span>
        <div>
          <span>Live studio identity</span>
          <strong>{settings.fullName || "Unnamed coach"}</strong>
          <small>{settings.specialization} · Coach account</small>
        </div>
        <p data-pending={changed || undefined}>
          {changed ? "Changes waiting" : "Synced"}
        </p>
      </section>

      <section className={styles.settingsGrid}>
        <form
          className={styles.formCard}
          onSubmit={(event) => {
            event.preventDefault();
            save();
          }}
        >
          <div className={styles.sectionHead}>
            <div>
              <span className={styles.kicker}>Public profile</span>
              <h2>Identity and contact</h2>
              <p>These fields save directly to your user and coach records.</p>
            </div>
            <UserRound size={21} />
          </div>
          <div className={styles.fields}>
            <label>
              <span>Full name</span>
              <div>
                <UserRound size={16} />
                <input
                  required
                  value={settings.fullName}
                  onChange={(event) => update("fullName", event.target.value)}
                />
              </div>
            </label>
            <label>
              <span>Email address</span>
              <div>
                <Mail size={16} />
                <input
                  required
                  type="email"
                  value={settings.email}
                  onChange={(event) => update("email", event.target.value)}
                />
              </div>
            </label>
            <label>
              <span>Phone number</span>
              <div>
                <Phone size={16} />
                <input
                  type="tel"
                  value={settings.phone}
                  onChange={(event) => update("phone", event.target.value)}
                />
              </div>
            </label>
            <label>
              <span>Primary specialization</span>
              <select
                value={settings.specialization}
                onChange={(event) =>
                  update("specialization", event.target.value)
                }
              >
                {specializationOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className={styles.formFoot}>
            <p role="status" data-pending={changed || undefined}>
              {message}
            </p>
            <button
              type="submit"
              className="mv-btn mv-btn-primary"
              disabled={!changed || saving}
            >
              <Save size={16} /> {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>

        <aside className={styles.sideStack}>
          <article className={styles.summaryCard}>
            <div className={styles.sectionHead}>
              <div>
                <span className={styles.kicker}>Account readout</span>
                <h2>Profile status</h2>
              </div>
              <CheckCircle2 size={21} />
            </div>
            <dl>
              <div>
                <dt>Role</dt>
                <dd>{settings.roleLabel || "Coach"}</dd>
              </div>
              <div>
                <dt>Specialization</dt>
                <dd>{settings.specialization}</dd>
              </div>
              <div>
                <dt>Database state</dt>
                <dd>{changed ? "Edits pending" : "Up to date"}</dd>
              </div>
            </dl>
          </article>

          <article className={styles.securityCard}>
            <ShieldCheck size={25} />
            <span className={styles.kicker}>Account security</span>
            <h2>Protect your access.</h2>
            <p>
              Update your password from the secure account flow. Identity edits
              here never expose authentication credentials.
            </p>
            <Link href="/change-password">
              <KeyRound size={16} /> Change password <ArrowRight size={16} />
            </Link>
          </article>
        </aside>
      </section>
    </div>
  );
}
