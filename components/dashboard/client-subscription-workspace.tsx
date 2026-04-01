import { CreditCard, Sparkles } from "lucide-react";

import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { clientSubscriptionRecord } from "@/lib/mocks/client-subscription";

export function ClientSubscriptionWorkspace() {
  return (
    <div className="dashboard-stack">
      <DashboardPageHeader
        eyebrow="My subscription"
        title="Subscription"
        description="An easy-to-read summary of your current plan, renewal timing, and included membership benefits."
      />

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
                {clientSubscriptionRecord.amountLabel} ·{" "}
                {clientSubscriptionRecord.billingCycle}
              </strong>
            </div>
          </div>
        </article>

        <article className="dashboard-panel">
          <div className="dashboard-panel__header">
            <div>
              <div className="mv-eyebrow">Included</div>
              <h2>Membership benefits</h2>
              <p>Clear value summary without exposing unfinished billing or backend behavior.</p>
            </div>
            <Sparkles size={20} color="#ff8b8f" />
          </div>

          <div className="dashboard-summary-list">
            {clientSubscriptionRecord.benefits.map((benefit) => (
              <div key={benefit} className="dashboard-summary-row">
                <strong>Included benefit</strong>
                <span>{benefit}</span>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
