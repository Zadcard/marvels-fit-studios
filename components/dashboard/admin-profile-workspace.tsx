"use client";

import { useState, useTransition } from "react";
import { KeyRound, Save } from "lucide-react";

import { saveAdminProfile } from "@/app/actions/admin-profile";
import { DashboardFormSection } from "@/components/dashboard/dashboard-form-section";
import { DashboardMiniStat } from "@/components/dashboard/dashboard-mini-stat";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { DashboardSurfaceNote } from "@/components/dashboard/dashboard-surface-note";
import { DashboardSwitch } from "@/components/dashboard/dashboard-switch";
import {
  type AdminProfilePreferences,
  type AdminProfileRecord,
} from "@/lib/mocks/admin-profile";

const defaultProfile: AdminProfileRecord = {
  fullName: "Admin User",
  roleLabel: "Studio Admin",
  email: "No email",
  phone: "No phone on file",
  location: "Studio HQ",
  bio: "Admin profile data is not available yet.",
  initials: "AU",
  joinedLabel: "Joined recently",
  credentialsNote: "Password updates are still a UI placeholder in this build.",
};
const defaultPreferences: AdminProfilePreferences = {
  emailUpdates: true,
  mobileAlerts: true,
  renewalEscalations: false,
};

type AdminProfileWorkspaceProps = {
  profile?: AdminProfileRecord | null;
  metrics?: Array<{
    id: string;
    label: string;
    value: string;
    detail: string;
    iconKey: "shield-check" | "timer-reset" | "trophy" | "bell-ring";
  }>;
  preferences?: AdminProfilePreferences | null;
};

export function AdminProfileWorkspace({
  profile: initialProfile,
  metrics = [],
  preferences: initialPreferences,
}: AdminProfileWorkspaceProps) {
  const [isSaving, startTransition] = useTransition();
  const [profile, setProfile] = useState<AdminProfileRecord>(
    initialProfile ?? defaultProfile
  );
  const [preferences, setPreferences] =
    useState<AdminProfilePreferences>(initialPreferences ?? defaultPreferences);
  const [saveMessage, setSaveMessage] = useState("Live profile loaded.");
  const pendingMetric = metrics.find((metric) => metric.id === "approvals") ?? metrics[0];
  const responseMetric =
    metrics.find((metric) => metric.id === "response-time") ?? metrics[1] ?? metrics[0];
  const alertMetric = metrics.find((metric) => metric.id === "alerts") ?? metrics[3] ?? metrics[0];

  const updateProfile = <Key extends keyof AdminProfileRecord>(
    field: Key,
    value: AdminProfileRecord[Key]
  ) => {
    setProfile((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const updatePreference = <Key extends keyof AdminProfilePreferences>(
    field: Key,
    value: AdminProfilePreferences[Key]
  ) => {
    setPreferences((current) => ({
      ...current,
      [field]: value,
    }));
  };

  return (
    <div className="dashboard-stack">
      <DashboardPageHeader
        eyebrow="Admin profile"
        actions={
          <button
            type="button"
            className="mv-btn mv-btn-primary"
            onClick={() =>
              startTransition(async () => {
                try {
                  await saveAdminProfile({
                    fullName: profile.fullName,
                    email: profile.email,
                  });
                  setSaveMessage("Admin profile saved.");
                } catch (error) {
                  setSaveMessage(
                    error instanceof Error ? error.message : "Could not save admin profile."
                  );
                }
              })
            }
          >
            <Save size={16} />
            {isSaving ? "Saving..." : "Save Profile"}
          </button>
        }
      />

      <DashboardSurfaceNote
        eyebrow="Account control"
        title={`${profile.fullName} manages the admin workspace from this account.`}
        description="Review identity details, keep notification defaults intentional, and treat this screen as the control point for admin-level communication."
        items={[
          `${pendingMetric?.value ?? "0"} items still need admin follow-up.`,
          `${alertMetric?.value ?? "0"} live account alerts can escalate into renewals or billing issues.`,
          saveMessage,
        ]}
      />

      <section
        className="dashboard-mini-grid dashboard-admin-priority-grid"
        aria-label="Admin profile highlights"
      >
        <DashboardMiniStat
          tone="accent"
          label={pendingMetric?.label ?? "Pending approvals"}
          value={pendingMetric?.value ?? "0"}
          description="Work queue tied to this admin account."
        />
        <DashboardMiniStat
          tone={preferences.mobileAlerts ? "success" : "warning"}
          label="Mobile alerts"
          value={preferences.mobileAlerts ? "Enabled" : "Muted"}
          description="Urgent schedule and client alerts."
        />
        <DashboardMiniStat
          tone={preferences.renewalEscalations ? "warning" : "success"}
          label={responseMetric?.label ?? "Ops response"}
          value={responseMetric?.value ?? "Clear"}
          description={
            preferences.renewalEscalations
              ? "Renewal escalations are active."
              : "Renewal escalations are quiet."
          }
        />
      </section>

      <section className="dashboard-panel dashboard-panel--accent dashboard-profile-hero">
        <div className="dashboard-profile-hero__identity">
          <div className="dashboard-profile-avatar">{profile.initials}</div>
          <div className="dashboard-profile-hero__copy">
            <span className="mv-eyebrow">{profile.roleLabel}</span>
            <h2>{profile.fullName}</h2>
            <p>{profile.bio}</p>
          </div>
        </div>

        <div className="dashboard-record-card__meta">
          <span>{profile.location}</span>
          <span>{profile.joinedLabel}</span>
          <span>{profile.email}</span>
        </div>
      </section>

      <section className="dashboard-detail-layout">
        <div className="dashboard-stack">
          <DashboardFormSection
            eyebrow="Identity"
            title="Personal details"
            description="Admin profile details."
          >
            <div className="dashboard-form-columns">
              <label className="dashboard-form-field">
                <span>Full name</span>
                <input
                  className="dashboard-input"
                  value={profile.fullName}
                  onChange={(event) => updateProfile("fullName", event.target.value)}
                />
              </label>
              <label className="dashboard-form-field">
                <span>Email</span>
                <input
                  className="dashboard-input"
                  value={profile.email}
                  onChange={(event) => updateProfile("email", event.target.value)}
                />
              </label>
              <label className="dashboard-form-field">
                <span>Phone</span>
                <input
                  className="dashboard-input"
                  value={profile.phone}
                  disabled
                  readOnly
                />
              </label>
              <label className="dashboard-form-field">
                <span>Location</span>
                <input
                  className="dashboard-input"
                  value={profile.location}
                  disabled
                  readOnly
                />
              </label>
            </div>

            <label className="dashboard-form-field">
              <span>Bio</span>
              <textarea
                className="dashboard-textarea"
                value={profile.bio}
                disabled
                readOnly
                rows={5}
              />
            </label>
          </DashboardFormSection>

          <DashboardFormSection
            eyebrow="Preferences"
            title="Communication preferences"
            description="Update preferences."
          >
            <div className="dashboard-stack">
              <DashboardSwitch
                checked={preferences.emailUpdates}
                onCheckedChange={(checked) => updatePreference("emailUpdates", checked)}
                label="Email updates"
                description="Weekly summaries by email."
              />
              <DashboardSwitch
                checked={preferences.mobileAlerts}
                onCheckedChange={(checked) => updatePreference("mobileAlerts", checked)}
                label="Mobile alerts"
                description="Time-sensitive schedule alerts."
              />
              <DashboardSwitch
                checked={preferences.renewalEscalations}
                onCheckedChange={(checked) =>
                  updatePreference("renewalEscalations", checked)
                }
                label="Renewal escalations"
                description="At-risk membership alerts."
              />
            </div>
          </DashboardFormSection>
        </div>

        <aside className="dashboard-detail-panel dashboard-stack">
          <article className="dashboard-panel">
            <div className="dashboard-panel__header">
              <div>
                <span className="mv-eyebrow">Security</span>
                <h2>Credentials placeholder</h2>
                <p>Credential settings preview.</p>
              </div>
              <KeyRound size={20} color="#ff8b8f" />
            </div>

            <div className="dashboard-form-columns">
              <label className="dashboard-form-field">
                <span>Current password</span>
                <input className="dashboard-input" placeholder="Mock placeholder" />
              </label>
              <label className="dashboard-form-field">
                <span>New password</span>
                <input className="dashboard-input" placeholder="Mock placeholder" />
              </label>
            </div>
          </article>

          <article className="dashboard-panel">
            <div className="dashboard-panel__header">
              <div>
                <span className="mv-eyebrow">Account note</span>
                <h2>Current profile state</h2>
                <p>{saveMessage}</p>
              </div>
            </div>

            <div className="dashboard-summary-list">
              <div className="dashboard-summary-row">
                <strong>Role</strong>
                <span>{profile.roleLabel}</span>
              </div>
              <div className="dashboard-summary-row">
                <strong>Joined</strong>
                <span>{profile.joinedLabel}</span>
              </div>
              <div className="dashboard-summary-row">
                <strong>Alerts</strong>
                <span>{preferences.mobileAlerts ? "Enabled" : "Muted"}</span>
              </div>
            </div>
          </article>
        </aside>
      </section>
    </div>
  );
}
