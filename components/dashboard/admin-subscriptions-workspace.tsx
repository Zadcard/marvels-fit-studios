"use client";

import { useDeferredValue, useEffect, useMemo, useState, useTransition } from "react";
import {
  BadgeDollarSign,
  CircleDollarSign,
  CreditCard,
  ReceiptText,
  RefreshCcw,
  ShieldCheck,
} from "lucide-react";
import { useRouter } from "next/navigation";

import {
  mutateAdminSubscriptionLifecycle,
  saveAdminSubscription,
} from "@/app/actions/admin-subscriptions";
import { DashboardEmptyState } from "@/components/dashboard/dashboard-empty-state";
import { DashboardFormSection } from "@/components/dashboard/dashboard-form-section";
import { DashboardManagementToolbar } from "@/components/dashboard/dashboard-management-toolbar";
import { DashboardModal } from "@/components/dashboard/dashboard-modal";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { DashboardPaginationControls } from "@/components/dashboard/dashboard-pagination-controls";
import { DashboardStatCard } from "@/components/dashboard/dashboard-stat-card";
import { DashboardStatusBadge } from "@/components/dashboard/dashboard-status-badge";
import { paginateDashboardItems } from "@/lib/dashboard/pagination";
import {
  adminPaymentStatusFilters,
  adminPlanFilters,
  adminSubscriptionStatusFilters,
  type AdminPaymentStatus,
  type AdminPlanType,
  type AdminSubscriptionRecord,
  type AdminSubscriptionStatus,
} from "@/lib/mocks/admin-subscriptions";

type EditableAdminSubscriptionStatus = Exclude<AdminSubscriptionStatus, "Canceled">;

type SubscriptionFormState = {
  clientId: string;
  planId: string;
  subscriptionStatus: EditableAdminSubscriptionStatus;
  paymentStatus: AdminPaymentStatus;
  amount: string;
  renewalDate: string;
};

type SubscriptionSort = "member-asc" | "member-desc" | "renewal-asc" | "payment";

const subscriptionSortOptions: Array<{ label: string; value: SubscriptionSort }> = [
  { label: "Member A-Z", value: "member-asc" },
  { label: "Member Z-A", value: "member-desc" },
  { label: "Renewal date", value: "renewal-asc" },
  { label: "Payment status", value: "payment" },
];

const emptySubscriptionForm: SubscriptionFormState = {
  clientId: "",
  planId: "",
  subscriptionStatus: "Active",
  paymentStatus: "Paid",
  amount: "",
  renewalDate: "",
};

type AdminSubscriptionsWorkspaceProps = {
  stats: Array<{
    id: string;
    label: string;
    value: string;
    change: string;
    detail: string;
    note: string;
    iconKey: "shield-check" | "refresh-ccw" | "circle-dollar-sign" | "badge-dollar-sign";
    tone: "accent" | "success" | "warning" | "neutral";
  }>;
  records: AdminSubscriptionRecord[];
  clientOptions: Array<{ id: string; label: string }>;
  planOptions: Array<{ id: string; label: string; amountLabel: string }>;
};

const statIconMap = {
  "shield-check": ShieldCheck,
  "refresh-ccw": RefreshCcw,
  "circle-dollar-sign": CircleDollarSign,
  "badge-dollar-sign": BadgeDollarSign,
} as const;

function getSubscriptionTone(status: AdminSubscriptionStatus) {
  switch (status) {
    case "Active":
      return "success";
    case "Pending renewal":
      return "warning";
    case "Canceled":
      return "accent";
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

function getSubscriptionHealthCopy(subscription: AdminSubscriptionRecord) {
  if (subscription.paymentStatus === "Overdue") {
    return "Needs immediate billing follow-up.";
  }

  if (subscription.paymentStatus === "Due soon") {
    return `Renews ${subscription.renewalDate}.`;
  }

  if (subscription.subscriptionStatus === "Trial") {
    return "Still in onboarding period.";
  }

  if (subscription.subscriptionStatus === "Pending renewal") {
    return "Needs renewal confirmation soon.";
  }

  if (subscription.subscriptionStatus === "Paused") {
    return "Paused until billing or roster changes are resolved.";
  }

  return "Billing is current.";
}

export function AdminSubscriptionsWorkspace({
  stats,
  records,
  clientOptions,
  planOptions,
}: AdminSubscriptionsWorkspaceProps) {
  const router = useRouter();
  const [subscriptionRecords, setSubscriptionRecords] =
    useState<AdminSubscriptionRecord[]>(records);
  const [searchTerm, setSearchTerm] = useState("");
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const [subscriptionFilter, setSubscriptionFilter] =
    useState<(typeof adminSubscriptionStatusFilters)[number]>("All statuses");
  const [paymentFilter, setPaymentFilter] =
    useState<(typeof adminPaymentStatusFilters)[number]>("All payments");
  const [planFilter, setPlanFilter] =
    useState<(typeof adminPlanFilters)[number]>("All plans");
  const [sortOrder, setSortOrder] = useState<SubscriptionSort>("member-asc");
  const [page, setPage] = useState(1);
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState(
    records[0]?.id ?? ""
  );
  const [editingSubscriptionId, setEditingSubscriptionId] = useState<string | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formState, setFormState] =
    useState<SubscriptionFormState>(emptySubscriptionForm);
  const [saveMessage, setSaveMessage] = useState("");
  const [isSaving, startTransition] = useTransition();
  const [isMutating, startMutationTransition] = useTransition();
  const [detailSubscriptionId, setDetailSubscriptionId] = useState<string | null>(null);

  useEffect(() => {
    setSubscriptionRecords(records);
  }, [records]);

  const selectedPlan = useMemo(
    () => planOptions.find((plan) => plan.id === formState.planId) ?? null,
    [formState.planId, planOptions]
  );

  const normalizedSearchTerm = deferredSearchTerm.trim().toLowerCase();

  const filteredSubscriptions = subscriptionRecords.filter((subscription) => {
    const matchesSearch =
      normalizedSearchTerm.length === 0 ||
      [
        subscription.memberName,
        subscription.planName,
        subscription.assignedCoach,
        subscription.note,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearchTerm);
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
  const sortedSubscriptions = useMemo(() => {
    return [...filteredSubscriptions].sort((left, right) => {
      if (sortOrder === "member-desc") {
        return right.memberName.localeCompare(left.memberName);
      }

      if (sortOrder === "renewal-asc") {
        return (
          new Date(left.renewalDateValue).getTime() -
          new Date(right.renewalDateValue).getTime()
        );
      }

      if (sortOrder === "payment") {
        return left.paymentStatus.localeCompare(right.paymentStatus);
      }

      return left.memberName.localeCompare(right.memberName);
    });
  }, [filteredSubscriptions, sortOrder]);
  const paginatedSubscriptions = paginateDashboardItems(sortedSubscriptions, page);

  const selectedSubscription =
    filteredSubscriptions.find(
      (subscription) => subscription.id === selectedSubscriptionId
    ) ??
    filteredSubscriptions[0] ??
    subscriptionRecords[0];
  const detailSubscription =
    filteredSubscriptions.find(
      (subscription) => subscription.id === detailSubscriptionId
    ) ?? null;

  const activeCount = filteredSubscriptions.filter(
    (subscription) => subscription.subscriptionStatus === "Active"
  ).length;
  const pendingRenewalCount = filteredSubscriptions.filter(
    (subscription) => subscription.subscriptionStatus === "Pending renewal"
  ).length;
  const trialCount = filteredSubscriptions.filter(
    (subscription) => subscription.subscriptionStatus === "Trial"
  ).length;
  const overdueCount = filteredSubscriptions.filter(
    (subscription) => subscription.paymentStatus === "Overdue"
  ).length;
  const dueSoonCount = filteredSubscriptions.filter(
    (subscription) => subscription.paymentStatus === "Due soon"
  ).length;
  const manualReviewCount = filteredSubscriptions.filter(
    (subscription) => subscription.paymentStatus === "Manual review"
  ).length;
  const visibleRevenue = filteredSubscriptions.reduce(
    (total, subscription) => total + Number(subscription.amountValue || 0),
    0
  );
  const isFiltered =
    normalizedSearchTerm.length > 0 ||
    subscriptionFilter !== "All statuses" ||
    paymentFilter !== "All payments" ||
    planFilter !== "All plans";

  useEffect(() => {
    setPage(1);
  }, [searchTerm, subscriptionFilter, paymentFilter, planFilter, sortOrder]);

  const planSummary = adminPlanFilters
    .filter((filter): filter is AdminPlanType => filter !== "All plans")
    .map((plan) => ({
      plan,
      total: filteredSubscriptions.filter(
        (subscription) => subscription.planName === plan
      ).length,
    }));

  const openEditModal = (subscription: AdminSubscriptionRecord) => {
    if (subscription.subscriptionStatus === "Canceled") {
      setSaveMessage("Canceled subscriptions can be reviewed in the detail pane.");
      return;
    }

    setEditingSubscriptionId(subscription.id);
    setFormState({
      clientId: subscription.clientId,
      planId: subscription.planId,
      subscriptionStatus: subscription.subscriptionStatus,
      paymentStatus: subscription.paymentStatus,
      amount: subscription.amountValue,
      renewalDate: subscription.renewalDateValue,
    });
    setSaveMessage("");
    setIsModalOpen(true);
  };

  const openSubscriptionDetail = (subscriptionId: string) => {
    setSelectedSubscriptionId(subscriptionId);
    setDetailSubscriptionId(subscriptionId);
  };

  const upsertLocalRecord = (saved: {
    id: string;
    clientId: string;
    planId: string;
    renewsAt: string;
    amount: number;
    paymentStatus: AdminPaymentStatus;
    subscriptionStatus: AdminSubscriptionStatus;
  }) => {
    const clientLabel =
      clientOptions.find((option) => option.id === saved.clientId)?.label ?? "Unknown client";
    const planOption = planOptions.find((option) => option.id === saved.planId);
    const existing = subscriptionRecords.find((record) => record.id === saved.id);
    const renewalDateValue = new Date(saved.renewsAt);
    const renewalDate = new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(renewalDateValue);
    const amountLabel = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "EGP",
      maximumFractionDigits: 0,
    }).format(saved.amount);

    const nextRecord: AdminSubscriptionRecord = {
      id: saved.id,
      clientId: saved.clientId,
      planId: saved.planId,
      memberName: clientLabel,
      planName:
        existing?.planName ??
        ((planOption?.label as AdminPlanType | undefined) ?? "Group Membership"),
      subscriptionStatus: saved.subscriptionStatus,
      paymentStatus: saved.paymentStatus,
      assignedCoach: existing?.assignedCoach ?? "Assigned via client roster",
      renewalDate,
      renewalDateValue: renewalDateValue.toISOString().slice(0, 10),
      amountLabel,
      amountValue: String(saved.amount),
      billingCycle: existing?.billingCycle ?? "Monthly",
      note:
        saved.paymentStatus === "Paid"
          ? "Latest payment is recorded."
          : "Payment follow-up is still needed.",
      paymentHistory: existing?.paymentHistory ?? [],
    };

    setSubscriptionRecords((current) => {
      const withoutExisting = current.filter((record) => record.id !== saved.id);
      return [nextRecord, ...withoutExisting];
    });
    setSelectedSubscriptionId(saved.id);
  };

  const handleLifecycleAction = (
    action: "pause" | "resume" | "cancel" | "renew"
  ) => {
    if (!selectedSubscription) {
      return;
    }

    setSaveMessage("");

    startMutationTransition(async () => {
      try {
        const result = await mutateAdminSubscriptionLifecycle(
          selectedSubscription.id,
          action
        );
        setSaveMessage(result.message);
        router.refresh();
      } catch (error) {
        setSaveMessage(
          error instanceof Error
            ? error.message
            : "Could not update subscription."
        );
      }
    });
  };

  return (
    <div className="dashboard-stack">
      <DashboardPageHeader
        eyebrow="Admin subscriptions"
        actions={
          <button
            type="button"
            className="mv-btn mv-btn-primary"
            onClick={() => {
              setEditingSubscriptionId(null);
              setFormState({
                ...emptySubscriptionForm,
                clientId: clientOptions[0]?.id ?? "",
                planId: planOptions[0]?.id ?? "",
                amount: planOptions[0]?.amountLabel.replace(/[^0-9.]/g, "") ?? "",
              });
              setSaveMessage("");
              setIsModalOpen(true);
            }}
          >
            <CreditCard size={16} />
            Add Subscription
          </button>
        }
      />

      <section className="dashboard-kpi-grid">
        {stats.map((stat) => {
          const Icon = statIconMap[stat.iconKey];

          return (
            <DashboardStatCard
              key={stat.id}
              label={stat.label}
              value={stat.value}
              change={stat.change}
              detail={stat.detail}
              note={stat.note}
              tone={stat.tone}
              icon={Icon}
            />
          );
        })}
      </section>

      <section className="dashboard-detail-layout">
        <article className="dashboard-panel dashboard-panel--accent">
          <div className="dashboard-panel__meta-strip">
            <span>{filteredSubscriptions.length} visible accounts</span>
            <span>{activeCount} active on plan</span>
            <span>
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "EGP",
                maximumFractionDigits: 0,
              }).format(visibleRevenue)}{" "}
              in visible revenue
            </span>
          </div>

          <DashboardManagementToolbar
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Search by member, plan, coach, or note"
            searchSuggestions={subscriptionRecords.map((subscription) => ({
              label: subscription.memberName,
              value: subscription.memberName,
              detail: `${subscription.planName} - ${subscription.assignedCoach}`,
            }))}
            summary={`${filteredSubscriptions.length} subscriptions in view, ${overdueCount} overdue`}
            sortValue={sortOrder}
            sortOptions={subscriptionSortOptions}
            onSortChange={(value) => setSortOrder(value as SubscriptionSort)}
            isFiltered={isFiltered}
            onReset={() => {
              setSearchTerm("");
              setSubscriptionFilter("All statuses");
              setPaymentFilter("All payments");
              setPlanFilter("All plans");
              setSortOrder("member-asc");
            }}
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
                onClick={() => selectedSubscription && openEditModal(selectedSubscription)}
                disabled={
                  !selectedSubscription ||
                  selectedSubscription.subscriptionStatus === "Canceled"
                }
              >
                <ReceiptText size={16} />
                Review Plan
              </button>
            }
          />

          <div className="dashboard-data-region">
            {filteredSubscriptions.length === 0 ? (
              <DashboardEmptyState
                title="No subscriptions match this view"
                description="Try a different search or reset the filters."
              />
            ) : (
              <>
                <div className="dashboard-table-wrap">
                  <table className="dashboard-table">
                    <thead>
                      <tr>
                        <th>Member</th>
                        <th>Plan</th>
                        <th>Coverage</th>
                        <th>Billing</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedSubscriptions.items.map((subscription) => (
                        <tr key={subscription.id}>
                          <td>
                            <div className="dashboard-table__identity">
                              <strong>{subscription.memberName}</strong>
                              <span>{subscription.assignedCoach}</span>
                              <small>{subscription.note}</small>
                            </div>
                          </td>
                          <td>
                            <div className="dashboard-subscription-table__plan">
                              <strong>{subscription.planName}</strong>
                              <span>{subscription.billingCycle}</span>
                              <small>{getSubscriptionHealthCopy(subscription)}</small>
                            </div>
                          </td>
                          <td>
                            <div className="dashboard-subscription-table__status">
                              <DashboardStatusBadge
                                label={subscription.subscriptionStatus}
                                tone={getSubscriptionTone(subscription.subscriptionStatus)}
                              />
                              <DashboardStatusBadge
                                label={subscription.paymentStatus}
                                tone={getPaymentTone(subscription.paymentStatus)}
                              />
                            </div>
                          </td>
                          <td>
                            <div className="dashboard-subscription-table__billing">
                              <strong>{subscription.amountLabel}</strong>
                              <span>{subscription.renewalDate}</span>
                              <small>{subscription.paymentStatus}</small>
                            </div>
                          </td>
                          <td className="dashboard-subscription-table__action">
                            <div className="dashboard-row-actions">
                              <button
                                type="button"
                                className="dashboard-inline-button"
                                onClick={() => openSubscriptionDetail(subscription.id)}
                              >
                                Inspect
                              </button>
                              <button
                                type="button"
                                className="dashboard-inline-button"
                                onClick={() => openEditModal(subscription)}
                                disabled={subscription.subscriptionStatus === "Canceled"}
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
                    <article
                      key={subscription.id}
                      className="dashboard-record-card dashboard-record-card--subscription"
                    >
                      <div className="dashboard-record-card__header">
                        <div>
                          <div className="dashboard-record-card__eyebrow">Subscription</div>
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
                      <p className="dashboard-record-card__note">
                        {getSubscriptionHealthCopy(subscription)}
                      </p>
                      <div className="dashboard-row-actions">
                        <button
                          type="button"
                          className="dashboard-inline-button"
                          onClick={() => openSubscriptionDetail(subscription.id)}
                        >
                          Open detail
                        </button>
                        <button
                          type="button"
                          className="dashboard-inline-button"
                          onClick={() => openEditModal(subscription)}
                          disabled={subscription.subscriptionStatus === "Canceled"}
                        >
                          Edit subscription
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </>
            )}
          </div>
          <DashboardPaginationControls
            page={paginatedSubscriptions.page}
            pageCount={paginatedSubscriptions.pageCount}
            startItem={paginatedSubscriptions.startItem}
            endItem={paginatedSubscriptions.endItem}
            totalItems={paginatedSubscriptions.totalItems}
            onPageChange={setPage}
          />
        </article>

        <aside className="dashboard-panel dashboard-detail-panel">
          {selectedSubscription ? (
            <>
              <div className="dashboard-panel__header">
                <div>
                  <span className="mv-eyebrow">Selected membership</span>
                  <h2>{selectedSubscription.memberName}</h2>
                  <p>{selectedSubscription.planName}</p>
                </div>
                <div className="dashboard-badge-stack">
                  <DashboardStatusBadge
                    label={selectedSubscription.subscriptionStatus}
                    tone={getSubscriptionTone(selectedSubscription.subscriptionStatus)}
                  />
                  <DashboardStatusBadge
                    label={selectedSubscription.paymentStatus}
                    tone={getPaymentTone(selectedSubscription.paymentStatus)}
                  />
                </div>
              </div>

              <div className="dashboard-detail-grid">
                <div className="dashboard-detail-stat">
                  <span className="dashboard-detail-stat__label">Plan</span>
                  <strong>{selectedSubscription.planName}</strong>
                  <small>{selectedSubscription.billingCycle}</small>
                </div>
                <div className="dashboard-detail-stat">
                  <span className="dashboard-detail-stat__label">Amount</span>
                  <strong>{selectedSubscription.amountLabel}</strong>
                  <small>Current visible billing amount.</small>
                </div>
                <div className="dashboard-detail-stat">
                  <span className="dashboard-detail-stat__label">Renewal</span>
                  <strong>{selectedSubscription.renewalDate}</strong>
                  <small>{getSubscriptionHealthCopy(selectedSubscription)}</small>
                </div>
                <div className="dashboard-detail-stat">
                  <span className="dashboard-detail-stat__label">Coach coverage</span>
                  <strong>{selectedSubscription.assignedCoach}</strong>
                  <small>Coach currently tied to the member roster.</small>
                </div>
              </div>

              <div className="dashboard-summary-list">
                <div className="dashboard-summary-row">
                  <strong>Billing note</strong>
                  <span>{selectedSubscription.note}</span>
                </div>
                <div className="dashboard-summary-row">
                  <strong>Next action</strong>
                  <span>{getSubscriptionHealthCopy(selectedSubscription)}</span>
                </div>
              </div>

              <div className="dashboard-row-actions">
                {selectedSubscription.subscriptionStatus === "Paused" ? (
                  <button
                    type="button"
                    className="mv-btn mv-btn-outline"
                    onClick={() => handleLifecycleAction("resume")}
                    disabled={isMutating}
                  >
                    {isMutating ? "Updating..." : "Resume"}
                  </button>
                ) : null}
                {selectedSubscription.subscriptionStatus !== "Paused" &&
                selectedSubscription.subscriptionStatus !== "Canceled" ? (
                  <button
                    type="button"
                    className="mv-btn mv-btn-outline"
                    onClick={() => handleLifecycleAction("pause")}
                    disabled={isMutating}
                  >
                    {isMutating ? "Updating..." : "Pause"}
                  </button>
                ) : null}
                {selectedSubscription.subscriptionStatus !== "Canceled" ? (
                  <button
                    type="button"
                    className="mv-btn mv-btn-primary"
                    onClick={() => handleLifecycleAction("renew")}
                    disabled={isMutating}
                  >
                    {isMutating ? "Updating..." : "Renew"}
                  </button>
                ) : null}
                {selectedSubscription.subscriptionStatus !== "Canceled" ? (
                  <button
                    type="button"
                    className="mv-btn mv-btn-danger"
                    onClick={() => handleLifecycleAction("cancel")}
                    disabled={isMutating}
                  >
                    {isMutating ? "Updating..." : "Cancel"}
                  </button>
                ) : null}
              </div>

              {saveMessage ? (
                <div className="dashboard-empty-state" role="status">
                  <strong>Subscription update</strong>
                  <p>{saveMessage}</p>
                </div>
              ) : null}

              <DashboardFormSection
                eyebrow="Plan mix"
                title="Visible plan split"
                description="Current plan split in this view."
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

              <DashboardFormSection
                eyebrow="Billing history"
                title="Recent payments"
                description="Latest recorded payments for this subscription."
              >
                {selectedSubscription.paymentHistory.length > 0 ? (
                  <div className="dashboard-summary-list">
                    {selectedSubscription.paymentHistory.map((payment) => (
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
                    <p>The payment log will appear here after the first recorded charge.</p>
                  </div>
                )}
              </DashboardFormSection>
            </>
          ) : (
            <DashboardEmptyState
              title="No subscription selected"
              description="Add a subscription or clear the filters to inspect one."
            />
          )}
        </aside>
      </section>

      <DashboardModal
        open={!!detailSubscription}
        onClose={() => setDetailSubscriptionId(null)}
        title={detailSubscription?.memberName ?? "Subscription details"}
        description={detailSubscription?.planName}
        size="wide"
        footer={
          detailSubscription ? (
            <button
              type="button"
              className="mv-btn mv-btn-primary"
              onClick={() => {
                setDetailSubscriptionId(null);
                openEditModal(detailSubscription);
              }}
              disabled={detailSubscription.subscriptionStatus === "Canceled"}
            >
              Edit Subscription
            </button>
          ) : null
        }
      >
        {detailSubscription ? (
          <div className="dashboard-stack">
            <div className="dashboard-badge-stack">
              <DashboardStatusBadge
                label={detailSubscription.subscriptionStatus}
                tone={getSubscriptionTone(detailSubscription.subscriptionStatus)}
              />
              <DashboardStatusBadge
                label={detailSubscription.paymentStatus}
                tone={getPaymentTone(detailSubscription.paymentStatus)}
              />
            </div>

            <div className="dashboard-detail-grid">
              <div className="dashboard-detail-stat">
                <span className="dashboard-detail-stat__label">Plan</span>
                <strong>{detailSubscription.planName}</strong>
                <small>{detailSubscription.billingCycle}</small>
              </div>
              <div className="dashboard-detail-stat">
                <span className="dashboard-detail-stat__label">Amount</span>
                <strong>{detailSubscription.amountLabel}</strong>
                <small>Current visible billing amount.</small>
              </div>
              <div className="dashboard-detail-stat">
                <span className="dashboard-detail-stat__label">Renewal</span>
                <strong>{detailSubscription.renewalDate}</strong>
                <small>{getSubscriptionHealthCopy(detailSubscription)}</small>
              </div>
              <div className="dashboard-detail-stat">
                <span className="dashboard-detail-stat__label">Coach coverage</span>
                <strong>{detailSubscription.assignedCoach}</strong>
                <small>Coach currently tied to the member roster.</small>
              </div>
            </div>

            <div className="dashboard-summary-list">
              <div className="dashboard-summary-row">
                <strong>Billing note</strong>
                <span>{detailSubscription.note}</span>
              </div>
              <div className="dashboard-summary-row">
                <strong>Next action</strong>
                <span>{getSubscriptionHealthCopy(detailSubscription)}</span>
              </div>
            </div>

            {detailSubscription.paymentHistory.length > 0 ? (
              <div className="dashboard-summary-list">
                {detailSubscription.paymentHistory.map((payment) => (
                  <div key={payment.id} className="dashboard-summary-row">
                    <strong>{payment.amountLabel}</strong>
                    <span>{payment.dateLabel}</span>
                    <span>{payment.note}</span>
                  </div>
                ))}
              </div>
            ) : (
              <DashboardEmptyState
                title="No payments recorded yet"
                description="The payment log will appear after the first recorded charge."
              />
            )}
          </div>
        ) : null}
      </DashboardModal>

      <DashboardModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSubscriptionId ? "Edit subscription" : "Add subscription"}
        description="Subscription details"
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
              disabled={isSaving}
              onClick={() =>
                startTransition(async () => {
                  try {
                    const saved = await saveAdminSubscription({
                      subscriptionId: editingSubscriptionId,
                      clientId: formState.clientId,
                      planId: formState.planId,
                      subscriptionStatus: formState.subscriptionStatus,
                      paymentStatus: formState.paymentStatus,
                      amount: formState.amount,
                      renewalDate: formState.renewalDate,
                    });
                    upsertLocalRecord(saved);
                    setSaveMessage(
                      editingSubscriptionId
                        ? "Subscription updated."
                        : "Subscription created."
                    );
                    setIsModalOpen(false);
                    router.refresh();
                  } catch (error) {
                    setSaveMessage(
                      error instanceof Error
                        ? error.message
                        : "Could not save subscription."
                    );
                  }
                })
              }
            >
              {isSaving
                ? "Saving..."
                : editingSubscriptionId
                ? "Save subscription"
                : "Create subscription"}
            </button>
          </>
        }
      >
        <div className="dashboard-form-grid">
          <label className="dashboard-form-field">
            <span>Member</span>
            <select
              className="dashboard-select"
              value={formState.clientId}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  clientId: event.target.value,
                }))
              }
            >
              <option value="">Choose client</option>
              {clientOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="dashboard-form-field">
            <span>Plan</span>
            <select
              className="dashboard-select"
              value={formState.planId}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  planId: event.target.value,
                  amount:
                    planOptions
                      .find((plan) => plan.id === event.target.value)
                      ?.amountLabel.replace(/[^0-9.]/g, "") ?? current.amount,
                }))
              }
            >
              <option value="">Choose plan</option>
              {planOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
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
                  subscriptionStatus:
                    event.target.value as EditableAdminSubscriptionStatus,
                }))
              }
            >
              {adminSubscriptionStatusFilters
                .filter(
                  (filter): filter is EditableAdminSubscriptionStatus =>
                    filter !== "All statuses" && filter !== "Canceled"
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
              type="date"
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
              value={formState.amount}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  amount: event.target.value,
                }))
              }
            />
          </label>
        </div>
        <div className="dashboard-summary-list">
          <div className="dashboard-summary-row">
            <strong>Selected plan</strong>
            <span>{selectedPlan?.label ?? "None selected"}</span>
          </div>
          <div className="dashboard-summary-row">
            <strong>Suggested amount</strong>
            <span>{selectedPlan?.amountLabel ?? "Not available"}</span>
          </div>
          {saveMessage ? (
            <div className="dashboard-summary-row">
              <strong>Status</strong>
              <span>{saveMessage}</span>
            </div>
          ) : null}
        </div>
      </DashboardModal>
    </div>
  );
}
