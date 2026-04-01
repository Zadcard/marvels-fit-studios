"use client";

import { useState } from "react";
import { RefreshCcw, Save } from "lucide-react";

import { DashboardFormSection } from "@/components/dashboard/dashboard-form-section";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { DashboardSwitch } from "@/components/dashboard/dashboard-switch";
import {
  adminStudioSettingOptions,
  adminStudioSettings,
  type AdminStudioSettings,
} from "@/lib/mocks/admin-settings";

const initialSettings: AdminStudioSettings = { ...adminStudioSettings };

export function AdminSettingsWorkspace() {
  const [settings, setSettings] = useState<AdminStudioSettings>(initialSettings);
  const [saveMessage, setSaveMessage] = useState(
    "Settings are mock-only in this phase."
  );

  const updateField = <Key extends keyof AdminStudioSettings>(
    field: Key,
    value: AdminStudioSettings[Key]
  ) => {
    setSettings((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const resetSettings = () => {
    setSettings(initialSettings);
    setSaveMessage("Defaults restored to the current mock studio setup.");
  };

  const saveSettings = () => {
    setSaveMessage("Mock settings saved locally for frontend review.");
  };

  return (
    <div className="dashboard-stack">
      <DashboardPageHeader
        eyebrow="Admin settings"
        title="Studio Settings"
        description="Organize the operational defaults now so future scheduling, notifications, and billing wiring have a clean home later."
        actions={
          <>
            <button type="button" className="mv-btn mv-btn-outline" onClick={resetSettings}>
              <RefreshCcw size={16} />
              Reset Mock
            </button>
            <button type="button" className="mv-btn mv-btn-primary" onClick={saveSettings}>
              <Save size={16} />
              Save Settings
            </button>
          </>
        }
      />

      <section className="dashboard-detail-layout">
        <div className="dashboard-stack">
          <DashboardFormSection
            eyebrow="Identity"
            title="Studio identity"
            description="Core studio details that keep the admin workspace aligned with the Marvel Fitness brand."
          >
            <div className="dashboard-form-columns">
              <label className="dashboard-form-field">
                <span>Studio name</span>
                <input
                  className="dashboard-input"
                  value={settings.studioName}
                  onChange={(event) =>
                    updateField("studioName", event.target.value)
                  }
                />
              </label>
              <label className="dashboard-form-field">
                <span>Support email</span>
                <input
                  className="dashboard-input"
                  value={settings.supportEmail}
                  onChange={(event) =>
                    updateField("supportEmail", event.target.value)
                  }
                />
              </label>
              <label className="dashboard-form-field">
                <span>Support phone</span>
                <input
                  className="dashboard-input"
                  value={settings.supportPhone}
                  onChange={(event) =>
                    updateField("supportPhone", event.target.value)
                  }
                />
              </label>
              <label className="dashboard-form-field">
                <span>Timezone</span>
                <input
                  className="dashboard-input"
                  value={settings.timezone}
                  onChange={(event) =>
                    updateField("timezone", event.target.value)
                  }
                />
              </label>
            </div>
          </DashboardFormSection>

          <DashboardFormSection
            eyebrow="Operations"
            title="Operations rhythm"
            description="Defaults that shape how the studio moves through classes, private sessions, and onboarding."
          >
            <div className="dashboard-form-columns">
              <label className="dashboard-form-field">
                <span>Default session length</span>
                <select
                  className="dashboard-select"
                  value={settings.defaultSessionLength}
                  onChange={(event) =>
                    updateField("defaultSessionLength", event.target.value)
                  }
                >
                  {adminStudioSettingOptions.sessionLengths.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              <label className="dashboard-form-field">
                <span>Intake lead time</span>
                <select
                  className="dashboard-select"
                  value={settings.intakeLeadTime}
                  onChange={(event) =>
                    updateField("intakeLeadTime", event.target.value)
                  }
                >
                  {adminStudioSettingOptions.intakeLeadTimes.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              <label className="dashboard-form-field">
                <span>Cancellation window</span>
                <select
                  className="dashboard-select"
                  value={settings.cancellationWindow}
                  onChange={(event) =>
                    updateField("cancellationWindow", event.target.value)
                  }
                >
                  {adminStudioSettingOptions.cancellationWindows.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              <label className="dashboard-form-field">
                <span>Private-session buffer</span>
                <select
                  className="dashboard-select"
                  value={settings.privateSessionBuffer}
                  onChange={(event) =>
                    updateField("privateSessionBuffer", event.target.value)
                  }
                >
                  {adminStudioSettingOptions.privateSessionBuffers.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </DashboardFormSection>

          <DashboardFormSection
            eyebrow="Notifications"
            title="Notification defaults"
            description="Mock toggles for the reminders and digest flows we will wire later."
          >
            <div className="dashboard-stack">
              <DashboardSwitch
                checked={settings.coachAutoReminders}
                onCheckedChange={(checked) =>
                  updateField("coachAutoReminders", checked)
                }
                label="Coach auto-reminders"
                description="Prepare day-of reminders for coaches before live messaging exists."
              />
              <DashboardSwitch
                checked={settings.memberCheckInAlerts}
                onCheckedChange={(checked) =>
                  updateField("memberCheckInAlerts", checked)
                }
                label="Member check-in alerts"
                description="Flag missed arrivals and manual follow-up moments for the front desk."
              />
              <DashboardSwitch
                checked={settings.renewalDigest}
                onCheckedChange={(checked) =>
                  updateField("renewalDigest", checked)
                }
                label="Renewal digest"
                description="Keep a weekly renewal summary ready for the future subscription workflow."
              />
            </div>
          </DashboardFormSection>

          <DashboardFormSection
            eyebrow="Booking"
            title="Booking controls"
            description="High-level rules that will later connect to the schedule and session creation flow."
          >
            <div className="dashboard-form-columns">
              <label className="dashboard-form-field">
                <span>Schedule starts on</span>
                <select
                  className="dashboard-select"
                  value={settings.scheduleStartDay}
                  onChange={(event) =>
                    updateField("scheduleStartDay", event.target.value)
                  }
                >
                  {adminStudioSettingOptions.scheduleStartDays.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <DashboardSwitch
              checked={settings.overbookWaitlist}
              onCheckedChange={(checked) => updateField("overbookWaitlist", checked)}
              label="Allow waitlist pressure mode"
              description="Keep an admin-only toggle ready for classes that need managed overflow."
            />
          </DashboardFormSection>
        </div>

        <aside className="dashboard-panel dashboard-detail-panel">
          <div className="dashboard-panel__header">
            <div>
              <span className="mv-eyebrow">Settings snapshot</span>
              <h2>Current defaults</h2>
              <p>{saveMessage}</p>
            </div>
          </div>

          <div className="dashboard-summary-list">
            <div className="dashboard-summary-row">
              <strong>Session length</strong>
              <span>{settings.defaultSessionLength}</span>
            </div>
            <div className="dashboard-summary-row">
              <strong>Lead time</strong>
              <span>{settings.intakeLeadTime}</span>
            </div>
            <div className="dashboard-summary-row">
              <strong>Waitlist mode</strong>
              <span>{settings.overbookWaitlist ? "Enabled" : "Disabled"}</span>
            </div>
            <div className="dashboard-summary-row">
              <strong>Schedule week</strong>
              <span>Starts on {settings.scheduleStartDay}</span>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
