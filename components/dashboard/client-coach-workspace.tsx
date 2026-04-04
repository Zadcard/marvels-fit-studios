import { Mail, MessageSquareMore, Phone, ShieldUser } from "lucide-react";

import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { DashboardSurfaceNote } from "@/components/dashboard/dashboard-surface-note";
import { clientCoachRecord } from "@/lib/mocks/client-coach";

export function ClientCoachWorkspace() {
  const sanitizedNextSession = clientCoachRecord.nextSession.replace("Â·", "·");

  return (
    <div className="dashboard-stack">
      <DashboardPageHeader eyebrow="My coach" />

      <DashboardSurfaceNote
        eyebrow="Coach"
        title="Your coach details and next touchpoint stay in one place."
        description="Contact details and coaching focus are easy to review here."
        items={[
          "Direct contact details.",
          "Current coaching note.",
        ]}
      />

      <section className="dashboard-mini-grid" aria-label="Coach relationship highlights">
        <article className="dashboard-mini-stat">
          <span className="dashboard-mini-stat__label">Specialization</span>
          <strong>{clientCoachRecord.specialization}</strong>
          <p>Main focus area.</p>
        </article>
        <article className="dashboard-mini-stat">
          <span className="dashboard-mini-stat__label">Next touchpoint</span>
          <strong>{sanitizedNextSession}</strong>
          <p>Next touchpoint.</p>
        </article>
        <article className="dashboard-mini-stat">
          <span className="dashboard-mini-stat__label">Communication</span>
          <strong>Direct</strong>
          <p>Phone and email available.</p>
        </article>
      </section>

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
            <span>{sanitizedNextSession}</span>
          </div>

          <div className="dashboard-row-actions">
            <a className="mv-btn mv-btn-outline" href={`mailto:${clientCoachRecord.email}`}>
              <Mail size={16} />
              Email coach
            </a>
            <a className="mv-btn mv-btn-primary" href={`tel:${clientCoachRecord.phone}`}>
              <Phone size={16} />
              Call coach
            </a>
          </div>
        </article>

        <article className="dashboard-panel">
          <div className="dashboard-panel__header">
            <div>
              <div className="mv-eyebrow">Coach details</div>
              <h2>Current support</h2>
              <p>Coach, timing, and contact details.</p>
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
              <span>{sanitizedNextSession}</span>
            </div>
            <div className="dashboard-summary-row">
              <strong>Current note</strong>
              <span>{clientCoachRecord.coachingNote}</span>
            </div>
            <div className="dashboard-summary-row">
              <strong>Focus</strong>
              <span>Coach timing and communication in one place.</span>
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
            <div className="dashboard-contact-card">
              <MessageSquareMore size={18} />
              <div>
                <strong>Current coaching focus</strong>
                <span>{clientCoachRecord.coachingNote}</span>
              </div>
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}
