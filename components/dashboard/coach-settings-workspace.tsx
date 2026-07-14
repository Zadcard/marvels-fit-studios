"use client";

import { useState, useTransition } from "react";
import { Save } from "lucide-react";

import { saveCoachSettings } from "@/app/actions/coach-settings";
import { AccountSecurityPanel } from "@/components/dashboard/account-security-panel";
import { DashboardFormSection } from "@/components/dashboard/dashboard-form-section";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { DashboardSurfaceNote } from "@/components/dashboard/dashboard-surface-note";
import type { CoachSettingsRecord } from "@/lib/mocks/coach-settings";

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
  const [settings, setSettings] = useState<CoachSettingsRecord>(initialValue);
  const [savedSettings, setSavedSettings] =
    useState<CoachSettingsRecord>(initialValue);
  const [saveMessage, setSaveMessage] = useState("Profile is up to date.");
  const [isSaving, startTransition] = useTransition();
  const hasChanges = JSON.stringify(settings) !== JSON.stringify(savedSettings);

  const updateField = <Key extends keyof CoachSettingsRecord>(
    field: Key,
    value: CoachSettingsRecord[Key]
  ) => {
    setSettings((current) => ({ ...current, [field]: value }));
    setSaveMessage("Unsaved profile changes.");
  };

  const saveProfile = () => {
    startTransition(async () => {
      try {
        await saveCoachSettings({
          fullName: settings.fullName,
          email: settings.email,
          phone: settings.phone,
          specialization: settings.specialization,
        });
        setSavedSettings(settings);
        setSaveMessage("Coach profile saved.");
      } catch (error) {
        setSaveMessage(
          error instanceof Error
            ? error.message
            : "Could not save coach settings."
        );
      }
    });
  };

  return (
    <div className="dashboard-stack">
      <DashboardPageHeader
        eyebrow="Coach settings"
        actions={
          <button
            type="button"
            className="mv-btn mv-btn-primary"
            disabled={!hasChanges || isSaving}
            onClick={saveProfile}
          >
            <Save size={16} />
            {isSaving ? "Saving..." : "Save profile"}
          </button>
        }
      />

      <DashboardSurfaceNote
        eyebrow="Member-facing profile"
        title="Keep the contact details clients and admins rely on current."
        description="Only settings that are stored and used by the product appear here. Notification preferences will return when delivery is connected."
        items={[saveMessage]}
      />

      <section className="dashboard-detail-layout">
        <DashboardFormSection
          eyebrow="Profile"
          title="Coach details"
          description="These fields save directly to your coach and user records."
        >
          <div className="dashboard-form-columns">
            <label className="dashboard-form-field">
              <span>Full name</span>
              <input
                className="dashboard-input"
                value={settings.fullName}
                onChange={(event) => updateField("fullName", event.target.value)}
              />
            </label>
            <label className="dashboard-form-field">
              <span>Email</span>
              <input
                className="dashboard-input"
                type="email"
                value={settings.email}
                onChange={(event) => updateField("email", event.target.value)}
              />
            </label>
            <label className="dashboard-form-field">
              <span>Phone</span>
              <input
                className="dashboard-input"
                type="tel"
                value={settings.phone}
                onChange={(event) => updateField("phone", event.target.value)}
              />
            </label>
            <label className="dashboard-form-field">
              <span>Specialization</span>
              <select
                className="dashboard-select"
                value={settings.specialization}
                onChange={(event) =>
                  updateField("specialization", event.target.value)
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
        </DashboardFormSection>

        <aside className="dashboard-panel dashboard-detail-panel">
          <div className="dashboard-panel__header">
            <div>
              <div className="mv-eyebrow">Profile summary</div>
              <h2>{settings.fullName}</h2>
              <p>{saveMessage}</p>
            </div>
          </div>
          <div className="dashboard-summary-list">
            <div className="dashboard-summary-row">
              <strong>Role</strong>
              <span>Coach</span>
            </div>
            <div className="dashboard-summary-row">
              <strong>Specialization</strong>
              <span>{settings.specialization}</span>
            </div>
            <div className="dashboard-summary-row">
              <strong>Save state</strong>
              <span>{hasChanges ? "Edits pending" : "Up to date"}</span>
            </div>
          </div>
        </aside>
      </section>

      <AccountSecurityPanel />
    </div>
  );
}
