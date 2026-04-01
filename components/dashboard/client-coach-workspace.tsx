import { Mail, Phone, ShieldUser } from "lucide-react";

import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { clientCoachRecord } from "@/lib/mocks/client-coach";

export function ClientCoachWorkspace() {
  return (
    <div className="dashboard-stack">
      <DashboardPageHeader
        eyebrow="My coach"
        title="Coach"
        description="A simple view of your assigned coach, your current focus, and the next coaching touchpoint."
      />

      <section className="dashboard-secondary-grid">
        <article className="dashboard-panel dashboard-panel--accent dashboard-profile-hero">
          <div className="dashboard-profile-hero__identity">
            <div className="dashboard-profile-avatar">AW</div>
            <div className="dashboard-profile-hero__copy">
              <span className="mv-eyebrow">{clientCoachRecord.roleLabel}</span>
              <h2>{clientCoachRecord.fullName}</h2>
              <p>{clientCoachRecord.bio}</p>
            </div>
          </div>

          <div className="dashboard-record-card__meta">
            <span>{clientCoachRecord.specialization}</span>
            <span>{clientCoachRecord.nextSession}</span>
          </div>
        </article>

        <article className="dashboard-panel">
          <div className="dashboard-panel__header">
            <div>
              <div className="mv-eyebrow">Coach details</div>
              <h2>How your support looks right now</h2>
              <p>Member-friendly details only, without admin or internal operations noise.</p>
            </div>
            <ShieldUser size={20} color="#ff8b8f" />
          </div>

          <div className="dashboard-summary-list">
            <div className="dashboard-summary-row">
              <strong>Specialization</strong>
              <span>{clientCoachRecord.specialization}</span>
            </div>
            <div className="dashboard-summary-row">
              <strong>Next session</strong>
              <span>{clientCoachRecord.nextSession}</span>
            </div>
            <div className="dashboard-summary-row">
              <strong>Current note</strong>
              <span>{clientCoachRecord.coachingNote}</span>
            </div>
          </div>

          <div className="dashboard-contact-grid">
            <div className="dashboard-contact-card">
              <Mail size={18} />
              <div>
                <strong>Coach email</strong>
                <span>{clientCoachRecord.email}</span>
              </div>
            </div>
            <div className="dashboard-contact-card">
              <Phone size={18} />
              <div>
                <strong>Coach phone</strong>
                <span>{clientCoachRecord.phone}</span>
              </div>
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}
