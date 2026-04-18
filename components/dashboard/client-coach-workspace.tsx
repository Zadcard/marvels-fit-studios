import { Mail, MessageSquareMore, Phone, ShieldUser } from "lucide-react";

import { DashboardMiniStat } from "@/components/dashboard/dashboard-mini-stat";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { DashboardSurfaceNote } from "@/components/dashboard/dashboard-surface-note";
import type { ClientCoachRecord } from "@/lib/dashboard/client-dashboard-data";

type ClientCoachWorkspaceProps = {
  data: ClientCoachRecord;
};

export function ClientCoachWorkspace({ data }: ClientCoachWorkspaceProps) {
  const sanitizedNextSession = data.nextSession.replace("Â·", "·");

  return (
    <div className="dashboard-stack">
      <DashboardPageHeader eyebrow="My coach" />

      <DashboardSurfaceNote
        eyebrow="Coach"
        title="Your coach details and next touchpoint stay in one place."
        description="Contact details and session timing are easy to review here."
        items={[
          "Direct contact details.",
          "Next planned touchpoint.",
        ]}
      />

      <section className="dashboard-mini-grid" aria-label="Coach relationship highlights">
        <DashboardMiniStat
          label="Specialization"
          value={data.specialization}
          description="Main focus area."
        />
        <DashboardMiniStat
          label="Next touchpoint"
          value={sanitizedNextSession}
          description="Next touchpoint."
        />
        <DashboardMiniStat
          label="Communication"
          value="Direct"
          description="Phone and email available."
        />
      </section>

      <section className="dashboard-secondary-grid">
        <article className="dashboard-panel dashboard-panel--accent dashboard-profile-hero">
          <div className="dashboard-profile-hero__identity">
            <div className="dashboard-profile-avatar">
              {data.fullName
                .split(" ")
                .map((part) => part[0])
                .slice(0, 2)
                .join("")
                .toUpperCase()}
            </div>
            <div className="dashboard-profile-hero__copy">
              <span className="mv-eyebrow">{data.roleLabel}</span>
              <h2>{data.fullName}</h2>
              <p>{data.bio}</p>
            </div>
          </div>

          <div className="dashboard-record-card__meta">
            <span>{data.specialization}</span>
            <span>{sanitizedNextSession}</span>
          </div>

          <div className="dashboard-row-actions">
            <a className="mv-btn mv-btn-outline" href={`mailto:${data.email}`}>
              <Mail size={16} />
              Email coach
            </a>
            <a className="mv-btn mv-btn-primary" href={`tel:${data.phone}`}>
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
              <span>{data.specialization}</span>
            </div>
            <div className="dashboard-summary-row">
              <strong>Next session</strong>
              <span>{sanitizedNextSession}</span>
            </div>
            <div className="dashboard-summary-row">
              <strong>Support summary</strong>
              <span>{data.coachingNote}</span>
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
                <span>{data.email}</span>
              </div>
            </div>
            <div className="dashboard-contact-card">
              <Phone size={18} />
              <div>
                <strong>Coach phone</strong>
                <span>{data.phone}</span>
              </div>
            </div>
            <div className="dashboard-contact-card">
              <MessageSquareMore size={18} />
              <div>
                <strong>Next support detail</strong>
                <span>{data.coachingNote}</span>
              </div>
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}
