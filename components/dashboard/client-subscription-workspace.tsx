import { CreditCard, Sparkles } from "lucide-react";

import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { DashboardSurfaceNote } from "@/components/dashboard/dashboard-surface-note";
import { clientSubscriptionRecord } from "@/lib/mocks/client-subscription";

export function ClientSubscriptionWorkspace() {
  const benefitsCount = clientSubscriptionRecord.benefits.length;

  return (
    <div className="dashboard-stack">
      <DashboardPageHeader eyebrow="My subscription" />

      <DashboardSurfaceNote
        eyebrow="Subscription"
        title="Plan status, renewal timing, and benefits stay in one place."
        description="Use this page for a quick read on your membership."
        items={[
          `${benefitsCount} benefits included.`,
          `Renews ${clientSubscriptionRecord.renewalDate}.`,
        ]}
      />

      <section className="dashboard-mini-grid" aria-label="Subscription highlights">
        <article className="dashboard-mini-stat">
          <span className="dashboard-mini-stat__label">Plan</span>
          <strong>{clientSubscriptionRecord.planName}</strong>
          <p>Current membership.</p>
        </article>
        <article className="dashboard-mini-stat">
          <span className="dashboard-mini-stat__label">Renewal</span>
          <strong>{clientSubscriptionRecord.renewalDate}</strong>
          <p>Renewal date.</p>
        </article>
        <article className="dashboard-mini-stat">
          <span className="dashboard-mini-stat__label">Benefits</span>
          <strong>{benefitsCount}</strong>
          <p>Included benefits.</p>
        </article>
      </section>

      <section className="dashboard-secondary-grid">
        <article className="dashboard-panel dashboard-panel--accent">
          <div className="dashboard-panel__header">
            <div>
              <div className="mv-eyebrow">Current plan</div>
              <h2>{clientSubscriptionRecord.planName}</h2>
              <p>{clientSubscriptionRecord.note}</p>
            </div>
            <CreditCard size={20} color="#ff8b8f" />
          </div>

          <div className="dashboard-detail-grid">
            <div className="dashboard-detail-stat">
              <span className="dashboard-detail-stat__label">Status</span>
              <strong>{clientSubscriptionRecord.status}</strong>
            </div>
            <div className="dashboard-detail-stat">
              <span className="dashboard-detail-stat__label">Payment</span>
              <strong>{clientSubscriptionRecord.paymentStatus}</strong>
            </div>
            <div className="dashboard-detail-stat">
              <span className="dashboard-detail-stat__label">Renews</span>
              <strong>{clientSubscriptionRecord.renewalDate}</strong>
            </div>
            <div className="dashboard-detail-stat">
              <span className="dashboard-detail-stat__label">Billing</span>
              <strong>
                {clientSubscriptionRecord.amountLabel} / {clientSubscriptionRecord.billingCycle}
              </strong>
            </div>
          </div>

          <div className="dashboard-info-strip">
            <strong>Billing</strong>
            <p>Payment history appears here when available.</p>
          </div>
        </article>

        <article className="dashboard-panel">
          <div className="dashboard-panel__header">
            <div>
              <div className="mv-eyebrow">Included</div>
              <h2>Membership benefits</h2>
              <p>What your plan includes.</p>
            </div>
            <Sparkles size={20} color="#ff8b8f" />
          </div>

          <div className="dashboard-summary-list">
            {clientSubscriptionRecord.benefits.map((benefit) => (
              <div key={benefit} className="dashboard-summary-row">
                <strong>Included</strong>
                <span>{benefit}</span>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
