"use client";

import { useState } from "react";
import { Save } from "lucide-react";

import { DashboardFormSection } from "@/components/dashboard/dashboard-form-section";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { DashboardSurfaceNote } from "@/components/dashboard/dashboard-surface-note";
import { DashboardSwitch } from "@/components/dashboard/dashboard-switch";
import {
  clientSettingsOptions,
  type ClientSettingsRecord,
} from "@/lib/dashboard/client-dashboard-data";

type ClientSettingsWorkspaceProps = {
  initialSettings: ClientSettingsRecord;
};

export function ClientSettingsWorkspace({ initialSettings }: ClientSettingsWorkspaceProps) {
  const [settings, setSettings] = useState<ClientSettingsRecord>(initialSettings);
  const [saveMessage, setSaveMessage] = useState("Preview mode.");
  const hasChanges = JSON.stringify(settings) !== JSON.stringify(initialSettings);
  const enabledNotifications = [
    settings.notificationEmail,
    settings.scheduleReminders,
    settings.coachUpdates,
  ].filter(Boolean).length;

  const updateField = <Key extends keyof ClientSettingsRecord>(
    field: Key,
    value: ClientSettingsRecord[Key]
  ) => {
    setSettings((current) => ({
      ...current,
      [field]: value,
    }));
  };

  return (
    <div className="dashboard-stack">
      <DashboardPageHeader
        eyebrow="My settings"
        actions={
          <button
            type="button"
            className="mv-btn mv-btn-primary"
            disabled={!hasChanges}
            onClick={() =>
              setSaveMessage("Preview updated.")
            }
          >
            <Save size={16} />
            Save changes
          </button>
        }
      />

      <DashboardSurfaceNote
        eyebrow="Settings"
        title="Profile details and alerts are grouped separately."
        description="Update your details and reminder preferences here."
        items={[
          `${enabledNotifications}/3 alerts enabled.`,
          hasChanges ? "Unsaved changes pending." : "No pending changes.",
        ]}
      />

      <section className="dashboard-mini-grid" aria-label="Client settings highlights">
        <article className="dashboard-mini-stat">
          <span className="dashboard-mini-stat__label">Preferred time</span>
          <strong>{settings.preferredSessionTime}</strong>
          <p>Current scheduling preference.</p>
        </article>
        <article className="dashboard-mini-stat">
          <span className="dashboard-mini-stat__label">Notifications on</span>
          <strong>{enabledNotifications}/3</strong>
          <p>Active alerts.</p>
        </article>
        <article className="dashboard-mini-stat">
          <span className="dashboard-mini-stat__label">Changes pending</span>
          <strong>{hasChanges ? "Yes" : "No"}</strong>
          <p>Pending edits.</p>
        </article>
      </section>

      <section className="dashboard-detail-layout">
        <div className="dashboard-stack">
          <DashboardFormSection
            eyebrow="Profile"
            title="Personal details"
            description="Basic profile details."
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
                  value={settings.email}
                  onChange={(event) => updateField("email", event.target.value)}
                />
              </label>
              <label className="dashboard-form-field">
                <span>Phone</span>
                <input
                  className="dashboard-input"
                  value={settings.phone}
                  onChange={(event) => updateField("phone", event.target.value)}
                />
              </label>
              <label className="dashboard-form-field">
                <span>Preferred session time</span>
                <select
                  className="dashboard-select"
                  value={settings.preferredSessionTime}
                  onChange={(event) =>
                    updateField("preferredSessionTime", event.target.value)
                  }
                >
                  {clientSettingsOptions.preferredSessionTimes.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="dashboard-form-field">
              <span>Goal</span>
              <textarea
                className="dashboard-textarea"
                rows={4}
                value={settings.goalLabel}
                onChange={(event) => updateField("goalLabel", event.target.value)}
              />
            </label>
          </DashboardFormSection>

          <DashboardFormSection
            eyebrow="Notifications"
            title="Preferences"
            description="Choose the reminders you want."
          >
            <div className="dashboard-stack">
              <DashboardSwitch
                checked={settings.notificationEmail}
                onCheckedChange={(checked) =>
                  updateField("notificationEmail", checked)
                }
                label="Email updates"
                description="Account and membership updates."
              />
              <DashboardSwitch
                checked={settings.scheduleReminders}
                onCheckedChange={(checked) =>
                  updateField("scheduleReminders", checked)
                }
                label="Session reminders"
                description="Reminders before booked sessions."
              />
              <DashboardSwitch
                checked={settings.coachUpdates}
                onCheckedChange={(checked) => updateField("coachUpdates", checked)}
                label="Coach updates"
                description="Updates from your coach."
              />
            </div>
          </DashboardFormSection>
        </div>

        <aside className="dashboard-panel dashboard-detail-panel">
          <div className="dashboard-panel__header">
            <div>
              <div className="mv-eyebrow">Profile snapshot</div>
              <h2>{settings.fullName}</h2>
              <p>{saveMessage}</p>
            </div>
          </div>

          <div className="dashboard-summary-list">
            <div className="dashboard-summary-row">
              <strong>Preferred time</strong>
              <span>{settings.preferredSessionTime}</span>
            </div>
            <div className="dashboard-summary-row">
              <strong>Goal</strong>
              <span>{settings.goalLabel}</span>
            </div>
            <div className="dashboard-summary-row">
              <strong>Coach updates</strong>
              <span>{settings.coachUpdates ? "Enabled" : "Muted"}</span>
            </div>
            <div className="dashboard-summary-row">
              <strong>Save state</strong>
              <span>{hasChanges ? "Edits pending" : "Up to date"}</span>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
