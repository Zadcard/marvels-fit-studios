"use client";

import { useState } from "react";
import { Save } from "lucide-react";

import { DashboardFormSection } from "@/components/dashboard/dashboard-form-section";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { DashboardSwitch } from "@/components/dashboard/dashboard-switch";
import {
  coachSettingsOptions,
  coachSettingsRecord,
  type CoachSettingsRecord,
} from "@/lib/mocks/coach-settings";

const initialSettings: CoachSettingsRecord = { ...coachSettingsRecord };

export function CoachSettingsWorkspace() {
  const [settings, setSettings] = useState<CoachSettingsRecord>(initialSettings);
  const [saveMessage, setSaveMessage] = useState(
    "Coach settings are mock-only in this frontend phase."
  );

  const updateField = <Key extends keyof CoachSettingsRecord>(
    field: Key,
    value: CoachSettingsRecord[Key]
  ) => {
    setSettings((current) => ({
      ...current,
      [field]: value,
    }));
  };

  return (
    <div className="dashboard-stack">
      <DashboardPageHeader
        eyebrow="Coach settings"
        title="Coach Settings"
        description="Keep coaching preferences, profile information, and notification habits organized without drifting into admin-only controls."
        actions={
          <button
            type="button"
            className="mv-btn mv-btn-primary"
            onClick={() => setSaveMessage("Mock coach settings saved locally.")}
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
            title="Coach profile"
            description="The basics that shape how this coach appears across the portal later."
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
                <span>Role label</span>
                <input
                  className="dashboard-input"
                  value={settings.roleLabel}
                  onChange={(event) => updateField("roleLabel", event.target.value)}
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
            </div>

            <label className="dashboard-form-field">
              <span>Bio</span>
              <textarea
                className="dashboard-textarea"
                rows={5}
                value={settings.bio}
                onChange={(event) => updateField("bio", event.target.value)}
              />
            </label>
          </DashboardFormSection>

          <DashboardFormSection
            eyebrow="Workflow"
            title="Coaching preferences"
            description="A lighter, role-appropriate settings surface centered on daily workflow."
          >
            <div className="dashboard-form-columns">
              <label className="dashboard-form-field">
                <span>Preferred landing view</span>
                <select
                  className="dashboard-select"
                  value={settings.preferredView}
                  onChange={(event) =>
                    updateField("preferredView", event.target.value)
                  }
                >
                  {coachSettingsOptions.preferredViews.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              <label className="dashboard-form-field">
                <span>Reminder lead time</span>
                <select
                  className="dashboard-select"
                  value={settings.reminderLeadTime}
                  onChange={(event) =>
                    updateField("reminderLeadTime", event.target.value)
                  }
                >
                  {coachSettingsOptions.reminderLeadTimes.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              <label className="dashboard-form-field">
                <span>Specialization</span>
                <input
                  className="dashboard-input"
                  value={settings.specialization}
                  onChange={(event) =>
                    updateField("specialization", event.target.value)
                  }
                />
              </label>
            </div>

            <label className="dashboard-form-field">
              <span>Availability note</span>
              <textarea
                className="dashboard-textarea"
                rows={4}
                value={settings.availabilityNote}
                onChange={(event) =>
                  updateField("availabilityNote", event.target.value)
                }
              />
            </label>
          </DashboardFormSection>

          <DashboardFormSection
            eyebrow="Notifications"
            title="Coach alerts"
            description="Choose which updates should stay visible while you're moving through the day."
          >
            <div className="dashboard-stack">
              <DashboardSwitch
                checked={settings.mobileAlerts}
                onCheckedChange={(checked) => updateField("mobileAlerts", checked)}
                label="Mobile alerts"
                description="Keep upcoming session reminders and urgent changes visible."
              />
              <DashboardSwitch
                checked={settings.clientCheckIns}
                onCheckedChange={(checked) => updateField("clientCheckIns", checked)}
                label="Client check-ins"
                description="Highlight clients who need a note or supportive follow-up."
              />
              <DashboardSwitch
                checked={settings.waitlistFlags}
                onCheckedChange={(checked) => updateField("waitlistFlags", checked)}
                label="Waitlist flags"
                description="Surface demand spikes on your assigned group classes."
              />
            </div>
          </DashboardFormSection>
        </div>

        <aside className="dashboard-panel dashboard-detail-panel">
          <div className="dashboard-panel__header">
            <div>
              <div className="mv-eyebrow">Coach snapshot</div>
              <h2>{settings.fullName}</h2>
              <p>{saveMessage}</p>
            </div>
          </div>

          <div className="dashboard-summary-list">
            <div className="dashboard-summary-row">
              <strong>Role</strong>
              <span>{settings.roleLabel}</span>
            </div>
            <div className="dashboard-summary-row">
              <strong>Preferred view</strong>
              <span>{settings.preferredView}</span>
            </div>
            <div className="dashboard-summary-row">
              <strong>Reminder timing</strong>
              <span>{settings.reminderLeadTime}</span>
            </div>
            <div className="dashboard-summary-row">
              <strong>Availability</strong>
              <span>{settings.availabilityNote}</span>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
