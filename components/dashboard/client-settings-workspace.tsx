"use client";

import { useState } from "react";
import { Save } from "lucide-react";

import { DashboardFormSection } from "@/components/dashboard/dashboard-form-section";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { DashboardSwitch } from "@/components/dashboard/dashboard-switch";
import {
  clientSettingsOptions,
  clientSettingsRecord,
  type ClientSettingsRecord,
} from "@/lib/mocks/client-settings";

const initialSettings: ClientSettingsRecord = { ...clientSettingsRecord };

export function ClientSettingsWorkspace() {
  const [settings, setSettings] = useState<ClientSettingsRecord>(initialSettings);
  const [saveMessage, setSaveMessage] = useState(
    "Profile settings are mock-only in this frontend phase."
  );

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
        title="Settings"
        description="Simple personal controls for your profile and notification preferences."
        actions={
          <button
            type="button"
            className="mv-btn mv-btn-primary"
            onClick={() => setSaveMessage("Mock member settings saved locally.")}
          >
            <Save size={16} />
            Save Settings
          </button>
        }
      />

      <section className="dashboard-detail-layout">
        <div className="dashboard-stack">
          <DashboardFormSection
            eyebrow="Profile"
            title="Personal details"
            description="Your member-facing profile basics, kept light and easy to edit."
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
            description="Choose the reminders and updates that help without adding noise."
          >
            <div className="dashboard-stack">
              <DashboardSwitch
                checked={settings.notificationEmail}
                onCheckedChange={(checked) =>
                  updateField("notificationEmail", checked)
                }
                label="Email updates"
                description="Receive account and membership updates by email."
              />
              <DashboardSwitch
                checked={settings.scheduleReminders}
                onCheckedChange={(checked) =>
                  updateField("scheduleReminders", checked)
                }
                label="Session reminders"
                description="Get reminders before upcoming booked sessions."
              />
              <DashboardSwitch
                checked={settings.coachUpdates}
                onCheckedChange={(checked) => updateField("coachUpdates", checked)}
                label="Coach updates"
                description="Stay informed when your coach adds plan or progress notes."
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
          </div>
        </aside>
      </section>
    </div>
  );
}
