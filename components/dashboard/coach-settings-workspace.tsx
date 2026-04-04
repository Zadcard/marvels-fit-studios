"use client";

import { useState } from "react";
import { Save } from "lucide-react";

import { DashboardFormSection } from "@/components/dashboard/dashboard-form-section";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { DashboardSurfaceNote } from "@/components/dashboard/dashboard-surface-note";
import { DashboardSwitch } from "@/components/dashboard/dashboard-switch";
import {
  coachSettingsOptions,
  coachSettingsRecord,
  type CoachSettingsRecord,
} from "@/lib/mocks/coach-settings";

const initialSettings: CoachSettingsRecord = { ...coachSettingsRecord };

export function CoachSettingsWorkspace() {
  const [settings, setSettings] = useState<CoachSettingsRecord>(initialSettings);
  const [saveMessage, setSaveMessage] = useState("Preview mode.");
  const hasChanges = JSON.stringify(settings) !== JSON.stringify(initialSettings);
  const enabledAlerts = [
    settings.mobileAlerts,
    settings.clientCheckIns,
    settings.waitlistFlags,
  ].filter(Boolean).length;

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
        title="Profile details and workflow alerts are grouped separately."
        description="Update coach details, preferences, and alerts here."
        items={[
          `${enabledAlerts}/3 alerts enabled.`,
          hasChanges ? "Unsaved changes pending." : "No pending changes.",
        ]}
      />

      <section className="dashboard-mini-grid" aria-label="Coach settings highlights">
        <article className="dashboard-mini-stat">
          <span className="dashboard-mini-stat__label">Preferred landing view</span>
          <strong>{settings.preferredView}</strong>
          <p>Preferred landing view.</p>
        </article>
        <article className="dashboard-mini-stat">
          <span className="dashboard-mini-stat__label">Alerts on</span>
          <strong>{enabledAlerts}/3</strong>
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
            title="Coach profile"
            description="Coach profile details."
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
            description="Daily workflow preferences."
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
            description="Choose which alerts stay visible."
          >
            <div className="dashboard-stack">
              <DashboardSwitch
                checked={settings.mobileAlerts}
                onCheckedChange={(checked) => updateField("mobileAlerts", checked)}
                label="Mobile alerts"
                description="Upcoming session reminders and urgent changes."
              />
              <DashboardSwitch
                checked={settings.clientCheckIns}
                onCheckedChange={(checked) => updateField("clientCheckIns", checked)}
                label="Client check-ins"
                description="Clients who need follow-up."
              />
              <DashboardSwitch
                checked={settings.waitlistFlags}
                onCheckedChange={(checked) => updateField("waitlistFlags", checked)}
                label="Waitlist flags"
                description="Demand spikes on group classes."
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
