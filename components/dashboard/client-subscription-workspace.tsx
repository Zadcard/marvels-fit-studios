import { CreditCard, Sparkles } from "lucide-react";

import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { DashboardSurfaceNote } from "@/components/dashboard/dashboard-surface-note";
import type { ClientSubscriptionRecord } from "@/lib/dashboard/client-dashboard-data";

type ClientSubscriptionWorkspaceProps = {
  data: ClientSubscriptionRecord;
};

export function ClientSubscriptionWorkspace({ data }: ClientSubscriptionWorkspaceProps) {
  const benefitsCount = data.benefits.length;

  return (
    <div className="dashboard-stack">
      <DashboardPageHeader eyebrow="My subscription" />

      <DashboardSurfaceNote
        eyebrow="Subscription"
        title="Plan status, renewal timing, and benefits stay in one place."
        description="Use this page for a quick read on your membership."
        items={[
          `${benefitsCount} benefits included.`,
          `Renews ${data.renewalDate}.`,
        ]}
      />

      <section className="dashboard-mini-grid" aria-label="Subscription highlights">
        <article className="dashboard-mini-stat">
          <span className="dashboard-mini-stat__label">Plan</span>
          <strong>{data.planName}</strong>
          <p>Current membership.</p>
        </article>
        <article className="dashboard-mini-stat">
          <span className="dashboard-mini-stat__label">Renewal</span>
          <strong>{data.renewalDate}</strong>
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
              <h2>{data.planName}</h2>
              <p>{data.note}</p>
            </div>
            <CreditCard size={20} color="#ff8b8f" />
          </div>

          <div className="dashboard-detail-grid">
            <div className="dashboard-detail-stat">
              <span className="dashboard-detail-stat__label">Status</span>
              <strong>{data.status}</strong>
            </div>
            <div className="dashboard-detail-stat">
              <span className="dashboard-detail-stat__label">Payment</span>
              <strong>{data.paymentStatus}</strong>
            </div>
            <div className="dashboard-detail-stat">
              <span className="dashboard-detail-stat__label">Renews</span>
              <strong>{data.renewalDate}</strong>
            </div>
            <div className="dashboard-detail-stat">
              <span className="dashboard-detail-stat__label">Billing</span>
              <strong>
                {data.amountLabel} / {data.billingCycle}
              </strong>
            </div>
          </div>

          <div className="dashboard-info-strip">
            <strong>Billing</strong>
            <p>
              {data.paymentHistory.length > 0
                ? "Recent payment activity is now available below."
                : "Payment history will appear here after the first recorded payment."}
            </p>
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
            {data.benefits.map((benefit) => (
              <div key={benefit} className="dashboard-summary-row">
                <strong>Included</strong>
                <span>{benefit}</span>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="dashboard-panel">
        <div className="dashboard-panel__header">
          <div>
            <div className="mv-eyebrow">Billing history</div>
            <h2>Recent payments</h2>
            <p>Your latest recorded membership payments.</p>
          </div>
        </div>

        {data.paymentHistory.length > 0 ? (
          <div className="dashboard-summary-list">
            {data.paymentHistory.map((payment) => (
              <div key={payment.id} className="dashboard-summary-row">
                <strong>{payment.amountLabel}</strong>
                <span>{payment.dateLabel}</span>
                <span>{payment.note}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="dashboard-empty-state">
            <strong>No payments recorded yet</strong>
            <p>Once a payment is captured, it will show up here automatically.</p>
          </div>
        )}
      </section>
    </div>
  );
}
