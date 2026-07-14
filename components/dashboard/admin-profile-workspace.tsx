"use client";

import { useState, useTransition } from "react";
import { Save } from "lucide-react";

import { saveAdminProfile } from "@/app/actions/admin-profile";
import { AccountSecurityPanel } from "@/components/dashboard/account-security-panel";
import { DashboardFormSection } from "@/components/dashboard/dashboard-form-section";
import { DashboardMiniStat } from "@/components/dashboard/dashboard-mini-stat";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { DashboardSurfaceNote } from "@/components/dashboard/dashboard-surface-note";
import type { AdminProfileRecord } from "@/lib/mocks/admin-profile";

const defaultProfile: AdminProfileRecord = {
  fullName: "Admin User",
  roleLabel: "Studio Admin",
  email: "No email",
  phone: "No phone on file",
  location: "Studio HQ",
  bio: "Manages studio operations.",
  initials: "AU",
  joinedLabel: "Joined recently",
  credentialsNote: "Password updates require the current password.",
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
};

export function AdminProfileWorkspace({
  profile: initialProfile,
  metrics = [],
}: AdminProfileWorkspaceProps) {
  const initialValue = initialProfile ?? defaultProfile;
  const [profile, setProfile] = useState(initialValue);
  const [savedProfile, setSavedProfile] = useState(initialValue);
  const [saveMessage, setSaveMessage] = useState("Profile is up to date.");
  const [isSaving, startTransition] = useTransition();
  const hasChanges =
    profile.fullName !== savedProfile.fullName ||
    profile.email !== savedProfile.email;

  const saveProfile = () => {
    startTransition(async () => {
      try {
        await saveAdminProfile({
          fullName: profile.fullName,
          email: profile.email,
        });
        setSavedProfile(profile);
        setSaveMessage("Admin profile saved.");
      } catch (error) {
        setSaveMessage(
          error instanceof Error
            ? error.message
            : "Could not save admin profile."
        );
      }
    });
  };

  return (
    <div className="dashboard-stack">
      <DashboardPageHeader
        eyebrow="Admin profile"
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
        eyebrow="Account control"
        title="Your admin identity and security settings."
        description="This page now shows only persisted controls. Studio-wide contact details remain in Studio Settings."
        items={[saveMessage]}
      />

      {metrics.length > 0 ? (
        <section className="dashboard-mini-grid" aria-label="Admin highlights">
          {metrics.slice(0, 3).map((metric) => (
            <DashboardMiniStat
              key={metric.id}
              label={metric.label}
              value={metric.value}
              description={metric.detail}
            />
          ))}
        </section>
      ) : null}

      <section className="dashboard-detail-layout">
        <DashboardFormSection
          eyebrow="Identity"
          title="Personal details"
          description="Name and email are used throughout the admin portal."
        >
          <div className="dashboard-form-columns">
            <label className="dashboard-form-field">
              <span>Full name</span>
              <input
                className="dashboard-input"
                value={profile.fullName}
                onChange={(event) => {
                  setProfile((current) => ({
                    ...current,
                    fullName: event.target.value,
                  }));
                  setSaveMessage("Unsaved profile changes.");
                }}
              />
            </label>
            <label className="dashboard-form-field">
              <span>Email</span>
              <input
                className="dashboard-input"
                type="email"
                value={profile.email}
                onChange={(event) => {
                  setProfile((current) => ({
                    ...current,
                    email: event.target.value,
                  }));
                  setSaveMessage("Unsaved profile changes.");
                }}
              />
            </label>
          </div>
        </DashboardFormSection>

        <aside className="dashboard-stack">
          <AccountSecurityPanel />
          <article className="dashboard-panel dashboard-detail-panel">
            <div className="dashboard-panel__header">
              <div>
                <div className="mv-eyebrow">Account summary</div>
                <h2>{profile.fullName}</h2>
                <p>{profile.joinedLabel}</p>
              </div>
            </div>
            <div className="dashboard-summary-list">
              <div className="dashboard-summary-row">
                <strong>Role</strong>
                <span>{profile.roleLabel}</span>
              </div>
              <div className="dashboard-summary-row">
                <strong>Email</strong>
                <span>{profile.email}</span>
              </div>
              <div className="dashboard-summary-row">
                <strong>Save state</strong>
                <span>{hasChanges ? "Edits pending" : "Up to date"}</span>
              </div>
            </div>
          </article>
        </aside>
      </section>
    </div>
  );
}
