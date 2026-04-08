"use client";

import { useState, useTransition } from "react";
import { BellRing, KeyRound, Save, ShieldCheck, TimerReset, Trophy } from "lucide-react";

import { saveAdminProfile } from "@/app/actions/admin-profile";
import { DashboardFormSection } from "@/components/dashboard/dashboard-form-section";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
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

const metricIconMap = {
  "shield-check": ShieldCheck,
  "timer-reset": TimerReset,
  trophy: Trophy,
  "bell-ring": BellRing,
} as const;

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

      <section className="dashboard-kpi-grid">
        {metrics.map((metric) => (
          <article key={metric.id} className="dashboard-profile-metric">
            <span className="dashboard-profile-metric__icon">
              {(() => {
                const Icon = metricIconMap[metric.iconKey];
                return <Icon size={18} />;
              })()}
            </span>
            <strong>{metric.value}</strong>
            <span>{metric.label}</span>
            <p>{metric.detail}</p>
          </article>
        ))}
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
                onCheckedChange={() => {}}
                label="Email updates"
                description="Weekly summaries by email."
              />
              <DashboardSwitch
                checked={preferences.mobileAlerts}
                onCheckedChange={() => {}}
                label="Mobile alerts"
                description="Time-sensitive schedule alerts."
              />
              <DashboardSwitch
                checked={preferences.renewalEscalations}
                onCheckedChange={() => {}}
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
