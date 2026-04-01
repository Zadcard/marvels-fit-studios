"use client";

import { useDeferredValue, useState } from "react";
import { CreditCard, ReceiptText } from "lucide-react";

import { DashboardFormSection } from "@/components/dashboard/dashboard-form-section";
import { DashboardManagementToolbar } from "@/components/dashboard/dashboard-management-toolbar";
import { DashboardModal } from "@/components/dashboard/dashboard-modal";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { DashboardStatCard } from "@/components/dashboard/dashboard-stat-card";
import { DashboardStatusBadge } from "@/components/dashboard/dashboard-status-badge";
import {
  adminPaymentStatusFilters,
  adminPlanFilters,
  adminSubscriptionRecords,
  adminSubscriptionStats,
  adminSubscriptionStatusFilters,
  type AdminPaymentStatus,
  type AdminPlanType,
  type AdminSubscriptionRecord,
  type AdminSubscriptionStatus,
} from "@/lib/mocks/admin-subscriptions";

type SubscriptionFormState = {
  memberName: string;
  planName: AdminPlanType;
  subscriptionStatus: AdminSubscriptionStatus;
  paymentStatus: AdminPaymentStatus;
  amountLabel: string;
  renewalDate: string;
};

const emptySubscriptionForm: SubscriptionFormState = {
  memberName: "",
  planName: "Group Membership",
  subscriptionStatus: "Active",
  paymentStatus: "Paid",
  amountLabel: "",
  renewalDate: "",
};

function getSubscriptionTone(status: AdminSubscriptionStatus) {
  switch (status) {
    case "Active":
      return "success";
    case "Pending renewal":
      return "warning";
    case "Trial":
      return "accent";
    default:
      return "neutral";
  }
}

function getPaymentTone(status: AdminPaymentStatus) {
  switch (status) {
    case "Paid":
      return "success";
    case "Due soon":
      return "warning";
    case "Overdue":
      return "accent";
    default:
      return "neutral";
  }
}

export function AdminSubscriptionsWorkspace() {
  const [searchTerm, setSearchTerm] = useState("");
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const [subscriptionFilter, setSubscriptionFilter] =
    useState<(typeof adminSubscriptionStatusFilters)[number]>("All statuses");
  const [paymentFilter, setPaymentFilter] =
    useState<(typeof adminPaymentStatusFilters)[number]>("All payments");
  const [planFilter, setPlanFilter] =
    useState<(typeof adminPlanFilters)[number]>("All plans");
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState(
    adminSubscriptionRecords[0]?.id ?? ""
  );
  const [editingSubscriptionId, setEditingSubscriptionId] = useState<string | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formState, setFormState] =
    useState<SubscriptionFormState>(emptySubscriptionForm);

  const filteredSubscriptions = adminSubscriptionRecords.filter((subscription) => {
    const query = deferredSearchTerm.trim().toLowerCase();
    const matchesSearch =
      query.length === 0 ||
      [
        subscription.memberName,
        subscription.planName,
        subscription.assignedCoach,
        subscription.note,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);
    const matchesSubscription =
      subscriptionFilter === "All statuses" ||
      subscription.subscriptionStatus === subscriptionFilter;
    const matchesPayment =
      paymentFilter === "All payments" ||
      subscription.paymentStatus === paymentFilter;
    const matchesPlan =
      planFilter === "All plans" || subscription.planName === planFilter;

    return matchesSearch && matchesSubscription && matchesPayment && matchesPlan;
  });

  const selectedSubscription =
    filteredSubscriptions.find(
      (subscription) => subscription.id === selectedSubscriptionId
    ) ??
    filteredSubscriptions[0] ??
    adminSubscriptionRecords[0];

  const planSummary = adminPlanFilters
    .filter((filter): filter is AdminPlanType => filter !== "All plans")
    .map((plan) => ({
      plan,
      total: filteredSubscriptions.filter(
        (subscription) => subscription.planName === plan
      ).length,
    }));

  const openEditModal = (subscription: AdminSubscriptionRecord) => {
    setEditingSubscriptionId(subscription.id);
    setFormState({
      memberName: subscription.memberName,
      planName: subscription.planName,
      subscriptionStatus: subscription.subscriptionStatus,
      paymentStatus: subscription.paymentStatus,
      amountLabel: subscription.amountLabel,
      renewalDate: subscription.renewalDate,
    });
    setIsModalOpen(true);
  };

  return (
    <div className="dashboard-stack">
      <DashboardPageHeader
        eyebrow="Admin subscriptions"
        title="Subscriptions Management"
        description="Keep plan state, billing posture, and renewal pressure visible in one polished surface before any real billing integration begins."
        actions={
          <button
            type="button"
            className="mv-btn mv-btn-primary"
            onClick={() => {
              setEditingSubscriptionId(null);
              setFormState(emptySubscriptionForm);
              setIsModalOpen(true);
            }}
          >
            <CreditCard size={16} />
            Add Subscription
          </button>
        }
      />

      <section className="dashboard-kpi-grid">
        {adminSubscriptionStats.map((stat) => (
          <DashboardStatCard key={stat.id} {...stat} />
        ))}
      </section>

      <section className="dashboard-detail-layout">
        <article className="dashboard-panel dashboard-panel--accent">
          <DashboardManagementToolbar
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Search by member, plan, coach, or note"
            summary={`${filteredSubscriptions.length} subscriptions matching the current filters`}
            filters={
              <>
                <label className="dashboard-filter-field">
                  <span>Plan</span>
                  <select
                    className="dashboard-select"
                    value={planFilter}
                    onChange={(event) =>
                      setPlanFilter(
                        event.target.value as (typeof adminPlanFilters)[number]
                      )
                    }
                  >
                    {adminPlanFilters.map((filter) => (
                      <option key={filter} value={filter}>
                        {filter}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="dashboard-filter-field">
                  <span>Subscription</span>
                  <select
                    className="dashboard-select"
                    value={subscriptionFilter}
                    onChange={(event) =>
                      setSubscriptionFilter(
                        event.target.value as (typeof adminSubscriptionStatusFilters)[number]
                      )
                    }
                  >
                    {adminSubscriptionStatusFilters.map((filter) => (
                      <option key={filter} value={filter}>
                        {filter}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="dashboard-filter-field">
                  <span>Payment</span>
                  <select
                    className="dashboard-select"
                    value={paymentFilter}
                    onChange={(event) =>
                      setPaymentFilter(
                        event.target.value as (typeof adminPaymentStatusFilters)[number]
                      )
                    }
                  >
                    {adminPaymentStatusFilters.map((filter) => (
                      <option key={filter} value={filter}>
                        {filter}
                      </option>
                    ))}
                  </select>
                </label>
              </>
            }
            actions={
              <button
                type="button"
                className="mv-btn mv-btn-outline"
                onClick={() => openEditModal(selectedSubscription)}
              >
                <ReceiptText size={16} />
                Review Plan
              </button>
            }
          />

          <div className="dashboard-data-region">
            <div className="dashboard-table-wrap">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Plan</th>
                    <th>Subscription</th>
                    <th>Payment</th>
                    <th>Renewal</th>
                    <th>Amount</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubscriptions.map((subscription) => (
                    <tr key={subscription.id}>
                      <td>
                        <div className="dashboard-table__identity">
                          <strong>{subscription.memberName}</strong>
                          <span>{subscription.assignedCoach}</span>
                          <small>{subscription.note}</small>
                        </div>
                      </td>
                      <td>{subscription.planName}</td>
                      <td>
                        <DashboardStatusBadge
                          label={subscription.subscriptionStatus}
                          tone={getSubscriptionTone(subscription.subscriptionStatus)}
                        />
                      </td>
                      <td>
                        <DashboardStatusBadge
                          label={subscription.paymentStatus}
                          tone={getPaymentTone(subscription.paymentStatus)}
                        />
                      </td>
                      <td>{subscription.renewalDate}</td>
                      <td>{subscription.amountLabel}</td>
                      <td>
                        <div className="dashboard-row-actions">
                          <button
                            type="button"
                            className="dashboard-inline-button"
                            onClick={() => setSelectedSubscriptionId(subscription.id)}
                          >
                            Inspect
                          </button>
                          <button
                            type="button"
                            className="dashboard-inline-button"
                            onClick={() => openEditModal(subscription)}
                          >
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="dashboard-mobile-list">
              {filteredSubscriptions.map((subscription) => (
                <article key={subscription.id} className="dashboard-record-card">
                  <div className="dashboard-record-card__header">
                    <div>
                      <h3>{subscription.memberName}</h3>
                      <p>{subscription.planName}</p>
                    </div>
                    <div className="dashboard-badge-stack">
                      <DashboardStatusBadge
                        label={subscription.subscriptionStatus}
                        tone={getSubscriptionTone(subscription.subscriptionStatus)}
                      />
                      <DashboardStatusBadge
                        label={subscription.paymentStatus}
                        tone={getPaymentTone(subscription.paymentStatus)}
                      />
                    </div>
                  </div>
                  <div className="dashboard-record-card__meta">
                    <span>{subscription.amountLabel}</span>
                    <span>{subscription.renewalDate}</span>
                    <span>{subscription.assignedCoach}</span>
                  </div>
                  <p className="dashboard-record-card__note">{subscription.note}</p>
                  <div className="dashboard-row-actions">
                    <button
                      type="button"
                      className="dashboard-inline-button"
                      onClick={() => setSelectedSubscriptionId(subscription.id)}
                    >
                      Open detail
                    </button>
                    <button
                      type="button"
                      className="dashboard-inline-button"
                      onClick={() => openEditModal(subscription)}
                    >
                      Edit subscription
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </article>

        <aside className="dashboard-panel dashboard-detail-panel">
          <div className="dashboard-panel__header">
            <div>
              <span className="mv-eyebrow">Selected membership</span>
              <h2>{selectedSubscription.memberName}</h2>
              <p>{selectedSubscription.note}</p>
            </div>
          </div>

          <div className="dashboard-detail-grid">
            <div className="dashboard-detail-stat">
              <span className="dashboard-detail-stat__label">Plan</span>
              <strong>{selectedSubscription.planName}</strong>
            </div>
            <div className="dashboard-detail-stat">
              <span className="dashboard-detail-stat__label">Cycle</span>
              <strong>{selectedSubscription.billingCycle}</strong>
            </div>
            <div className="dashboard-detail-stat">
              <span className="dashboard-detail-stat__label">Renewal</span>
              <strong>{selectedSubscription.renewalDate}</strong>
            </div>
            <div className="dashboard-detail-stat">
              <span className="dashboard-detail-stat__label">Amount</span>
              <strong>{selectedSubscription.amountLabel}</strong>
            </div>
          </div>

          <DashboardFormSection
            eyebrow="Plan mix"
            title="Visible plan split"
            description="A fast read on which membership tiers dominate the filtered list."
          >
            <div className="dashboard-summary-list">
              {planSummary.map((item) => (
                <div key={item.plan} className="dashboard-summary-row">
                  <strong>{item.plan}</strong>
                  <span>{item.total} accounts in view</span>
                </div>
              ))}
            </div>
          </DashboardFormSection>
        </aside>
      </section>

      <DashboardModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSubscriptionId ? "Edit subscription" : "Add subscription"}
        description="This billing form is intentionally mock-only and gives the admin frontend a realistic management shape without real payment wiring."
        footer={
          <>
            <button
              type="button"
              className="mv-btn mv-btn-outline"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="mv-btn mv-btn-primary"
              onClick={() => setIsModalOpen(false)}
            >
              {editingSubscriptionId
                ? "Save mock changes"
                : "Create mock subscription"}
            </button>
          </>
        }
      >
        <div className="dashboard-form-grid">
          <label className="dashboard-form-field">
            <span>Member</span>
            <input
              className="dashboard-input"
              value={formState.memberName}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  memberName: event.target.value,
                }))
              }
            />
          </label>
          <label className="dashboard-form-field">
            <span>Plan</span>
            <select
              className="dashboard-select"
              value={formState.planName}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  planName: event.target.value as AdminPlanType,
                }))
              }
            >
              {adminPlanFilters
                .filter((filter): filter is AdminPlanType => filter !== "All plans")
                .map((filter) => (
                  <option key={filter} value={filter}>
                    {filter}
                  </option>
                ))}
            </select>
          </label>
          <label className="dashboard-form-field">
            <span>Subscription status</span>
            <select
              className="dashboard-select"
              value={formState.subscriptionStatus}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  subscriptionStatus: event.target.value as AdminSubscriptionStatus,
                }))
              }
            >
              {adminSubscriptionStatusFilters
                .filter(
                  (filter): filter is AdminSubscriptionStatus =>
                    filter !== "All statuses"
                )
                .map((filter) => (
                  <option key={filter} value={filter}>
                    {filter}
                  </option>
                ))}
            </select>
          </label>
          <label className="dashboard-form-field">
            <span>Payment status</span>
            <select
              className="dashboard-select"
              value={formState.paymentStatus}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  paymentStatus: event.target.value as AdminPaymentStatus,
                }))
              }
            >
              {adminPaymentStatusFilters
                .filter(
                  (filter): filter is AdminPaymentStatus =>
                    filter !== "All payments"
                )
                .map((filter) => (
                  <option key={filter} value={filter}>
                    {filter}
                  </option>
                ))}
            </select>
          </label>
          <label className="dashboard-form-field">
            <span>Renewal date</span>
            <input
              className="dashboard-input"
              value={formState.renewalDate}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  renewalDate: event.target.value,
                }))
              }
            />
          </label>
          <label className="dashboard-form-field">
            <span>Amount</span>
            <input
              className="dashboard-input"
              value={formState.amountLabel}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  amountLabel: event.target.value,
                }))
              }
            />
          </label>
        </div>
      </DashboardModal>
    </div>
  );
}
