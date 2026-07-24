"use client";

import { useEffect, useMemo, useState, useTransition, type FormEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Dialog } from "radix-ui";
import {
  ArrowDownAZ,
  ArrowUpAZ,
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  Pencil,
  Plus,
  ReceiptText,
  Search,
  TriangleAlert,
  Trash2,
  X,
} from "lucide-react";

import { deleteAdminClient, saveAdminClient } from "@/app/actions/admin-clients";
import type { AdminClientInitialOption, AdminClientRecord } from "@/lib/dashboard/admin-dashboard-data";
import {
  trialOutcomeLabels,
} from "@/lib/dashboard/client-domain-labels";
import type { TrainingCategoryOption } from "@/lib/dashboard/training-category";
import { paginateDashboardItems } from "@/lib/dashboard/pagination";
import { formatPhoneNumber } from "@/lib/phone-format";
import { buildWhatsAppHref } from "@/lib/whatsapp";
import {
  ConfirmDeleteDialog,
  EntityDialog,
  EntityForm,
  FormActions,
  FormErrorBanner,
  FormField,
} from "@/components/ui/entity-form";
import { ClientAttendanceHistory } from "./client-attendance-history";
import { ClientReceiptHistory } from "./client-receipt-history";
import { useDashboardToast } from "./dashboard-toast-provider";
import styles from "./admin-clients-workspace.module.css";

type Props = {
  records: AdminClientRecord[];
  searchValue: string;
  selectedInitial: string | null;
  sortOrder: "asc" | "desc";
  currentPage: number;
  totalCount: number;
  filteredCount: number;
  initialOptions: AdminClientInitialOption[];
  groupOptions: Array<{ id: string; name: string; categoryId: string }>;
  categoryOptions: TrainingCategoryOption[];
};

type ClientForm = {
  fullName: string;
  phone: string;
  status: AdminClientRecord["status"];
  trialOutcome: AdminClientRecord["trialOutcome"];
  paymentStatus: AdminClientRecord["paymentStatus"];
  paymentAmount: string;
  groupId: string;
  categoryId: string;
  sport: string;
  injuryStatus: AdminClientRecord["injuryStatus"];
  injuryNotes: string;
  restrictions: string;
};

const emptyForm: ClientForm = {
  fullName: "",
  phone: "",
  status: "Active",
  trialOutcome: "Not recorded",
  paymentStatus: "Unpaid",
  paymentAmount: "",
  groupId: "",
  categoryId: "",
  sport: "",
  injuryStatus: "None",
  injuryNotes: "",
  restrictions: "",
};



export type ClientSegment =
  | "Active Members"
  | "Inactive Members"
  | "Active Leads"
  | "Lost Leads"
  | "All Members"
  | "Injuries";

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

function clientType(record: AdminClientRecord) {
  if (
    record.membership === "Private Coaching" ||
    (record.trainingCategory as string) === "PT" ||
    (record.trainingCategory as string) === "Rehab"
  ) {
    return "PRIVATE";
  }
  return "GROUP";
}

function statusStyle(status: string) {
  if (["Active", "Paid"].includes(status)) return styles.statusActive;
  if (["Paused", "Lapsed Client"].includes(status)) return styles.statusPaused;
  if (["Trial", "Pending", "Lapsed Trial", "Expiring", "Due soon"].includes(status)) return styles.statusTrial;
  return styles.statusInactive;
}

export function AdminClientsWorkspace({
  records,
  sortOrder,
  currentPage,
  totalCount,
  filteredCount,
  groupOptions,
  categoryOptions,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { showToast } = useDashboardToast();
  const [isPending, startTransition] = useTransition();

  const searchValue = searchParams.get("q") ?? "";
  const initialSegmentParam = searchParams.get("segment");
  const initialSegment = useMemo(() => {
    if (initialSegmentParam === "inactive-members") return "Inactive Members";
    if (initialSegmentParam === "active-leads") return "Active Leads";
    if (initialSegmentParam === "lost-leads") return "Lost Leads";
    if (initialSegmentParam === "all") return "All Members";
    if (initialSegmentParam === "injuries") return "Injuries";
    return "Active Members";
  }, [initialSegmentParam]);

  const [segment, setSegment] = useState<ClientSegment>(initialSegment);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [historyTab, setHistoryTab] = useState<"receipts" | "attendance">("receipts");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteText, setDeleteText] = useState("");
  const [form, setForm] = useState<ClientForm>(emptyForm);
  const [error, setError] = useState("");

  const groupsInFormCategory = useMemo(
    () => groupOptions.filter((group) => group.categoryId === form.categoryId),
    [groupOptions, form.categoryId],
  );

  const counts = useMemo(() => {
    return {
      all: records.length,
      activeMembers: records.filter((r) => r.status === "Active" || r.subscriptionStatus === "Active").length,
      inactiveMembers: records.filter((r) => (r.status === "Inactive" || r.status === "Paused" || r.subscriptionStatus === "Inactive") && r.status !== "Did not continue" && r.trialOutcome !== "Did not continue").length,
      activeLeads: records.filter((r) => r.status === "Pending" || r.status === "Trial" || r.trialOutcome === "Follow up later" || r.trialOutcome === "Needs different option" || r.trialOutcome === "No response").length,
      lostLeads: records.filter((r) => r.status === "Did not continue" || r.trialOutcome === "Did not continue").length,
      injuries: records.filter((r) => r.hasInjuryAlert || r.injuryStatus !== "None").length,
    };
  }, [records]);

  const filtered = useMemo(() => {
    return records.filter((record) => {
      if (segment === "All Members") return true;
      if (segment === "Active Members") return record.status === "Active" || record.subscriptionStatus === "Active";
      if (segment === "Inactive Members") {
        return (record.status === "Inactive" || record.status === "Paused" || record.subscriptionStatus === "Inactive") && record.status !== "Did not continue" && record.trialOutcome !== "Did not continue";
      }
      if (segment === "Active Leads") {
        return record.status === "Pending" || record.status === "Trial" || record.trialOutcome === "Follow up later" || record.trialOutcome === "Needs different option" || record.trialOutcome === "No response";
      }
      if (segment === "Lost Leads") {
        return record.status === "Did not continue" || record.trialOutcome === "Did not continue";
      }
      if (segment === "Injuries") return record.hasInjuryAlert || record.injuryStatus !== "None";
      return true;
    });
  }, [records, segment]);

  const paginated = paginateDashboardItems(filtered, currentPage);
  const detail = records.find((record) => record.id === detailId) ?? null;
  const editing = records.find((record) => record.id === editingId) ?? null;

  useEffect(() => {
    if (searchParams.get("new") !== "1") return;
    setEditingId(null);
    setForm({ ...emptyForm, categoryId: categoryOptions[0]?.id ?? "" });
    setError("");
    setEditorOpen(true);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("new");
    window.history.replaceState(
      null,
      "",
      params.size ? `${pathname}?${params.toString()}` : pathname,
    );
  }, [categoryOptions, pathname, router, searchParams]);

  function setQuery(key: string, value?: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value); else params.delete(key);
    if (key !== "page") params.delete("page");
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  }

  const [isLeadModal, setIsLeadModal] = useState(false);

  function openCreateMember() {
    setEditingId(null);
    setIsLeadModal(false);
    setForm({
      ...emptyForm,
      status: "Active",
      trialOutcome: "Subscribed",
      categoryId: categoryOptions[0]?.id ?? "",
    });
    setError("");
    setEditorOpen(true);
  }

  function openCreateLead() {
    setEditingId(null);
    setIsLeadModal(true);
    setForm({
      ...emptyForm,
      status: "Pending",
      trialOutcome: "Follow up later",
      categoryId: categoryOptions[0]?.id ?? "",
    });
    setError("");
    setEditorOpen(true);
  }

  function openEdit(record: AdminClientRecord) {
    setEditingId(record.id);
    const isLeadRecord = record.status === "Pending" || record.status === "Trial" || record.trialOutcome !== "Subscribed";
    setIsLeadModal(isLeadRecord);
    setForm({
      fullName: record.fullName,
      phone: record.phone,
      status: record.status,
      trialOutcome: record.trialOutcome,
      paymentStatus: record.paymentStatus,
      paymentAmount: record.paymentAmountLabel.replace(/[^0-9.]/g, ""),
      groupId: record.groups[0]?.id ?? "",
      categoryId: record.categoryId ?? categoryOptions[0]?.id ?? "",
      sport: record.sport,
      injuryStatus: record.injuryStatus,
      injuryNotes: record.injuryNotes,
      restrictions: record.restrictions,
    });
    setError("");
    setEditorOpen(true);
  }

  function submitClient(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    startTransition(async () => {
      try {
        await saveAdminClient({
          clientId: editingId ?? undefined,
          fullName: form.fullName,
          phone: form.phone || undefined,
          status: form.status,
          trialOutcome: form.trialOutcome,
          paymentStatus: form.paymentStatus,
          paymentAmount: form.paymentAmount ? form.paymentAmount : undefined,
          groupId: form.groupId || undefined,
          categoryId: form.categoryId,
          sport: form.sport || undefined,
          injuryStatus: form.injuryStatus,
          injuryNotes: form.injuryNotes || undefined,
          restrictions: form.restrictions || undefined,
        });
        setEditorOpen(false);
        showToast(editingId ? "Member updated." : "Record created.");
        router.refresh();
      } catch (caught) {
        const description = caught instanceof Error ? caught.message : "Could not save the record.";
        setError(description);
        showToast(description, "warning");
      }
    });
  }

  function openDelete(record: AdminClientRecord) {
    setEditingId(record.id);
    setDeleteText("");
    setError("");
    setDeleteOpen(true);
  }

  function confirmDelete() {
    if (!editing) return;
    setError("");
    startTransition(async () => {
      try {
        await deleteAdminClient({ clientId: editing.id, confirmationText: deleteText });
        setDeleteOpen(false);
        setEditorOpen(false);
        setDetailId(null);
        setDeleteText("");
        showToast("Record deleted.");
        router.refresh();
      } catch (caught) {
        const description = caught instanceof Error ? caught.message : "Could not delete the record.";
        setError(description);
        showToast(description, "warning");
      }
    });
  }

  return (
    <div className={styles.page} aria-busy={isPending}>
      {/* ── Level 1 Interactive Segment Cards ── */}
      <div className={styles.metricsBar} role="region" aria-label="Directory Category Overview">
        <button
          type="button"
          className={styles.metricCard}
          data-active={segment === "Active Members" || undefined}
          onClick={() => setSegment("Active Members")}
        >
          <span className={styles.metricLabel} style={{ color: segment === "Active Members" ? "#25d366" : undefined }}>
            🏋️ Active Members
          </span>
          <span className={styles.metricValue} style={{ color: "#25d366" }}>{counts.activeMembers}</span>
          <span className={styles.metricSubtext}>Active subscribers</span>
        </button>

        <button
          type="button"
          className={styles.metricCard}
          data-active={segment === "Inactive Members" || undefined}
          onClick={() => setSegment("Inactive Members")}
          style={{ borderColor: segment !== "Inactive Members" && counts.inactiveMembers > 0 ? "rgba(140, 140, 140, 0.4)" : undefined }}
        >
          <span className={styles.metricLabel} style={{ color: "#a0a0a0" }}>
            🔄 Inactive Members
          </span>
          <span className={styles.metricValue} style={{ color: "#a0a0a0" }}>{counts.inactiveMembers}</span>
          <span className={styles.metricSubtext}>Expired &amp; paused</span>
        </button>

        <button
          type="button"
          className={styles.metricCard}
          data-active={segment === "Active Leads" || undefined}
          onClick={() => setSegment("Active Leads")}
        >
          <span className={styles.metricLabel} style={{ color: segment === "Active Leads" ? "#3b82f6" : undefined }}>
            📥 Active Leads
          </span>
          <span className={styles.metricValue} style={{ color: "#3b82f6" }}>{counts.activeLeads}</span>
          <span className={styles.metricSubtext}>Trial inquiries</span>
        </button>

        <button
          type="button"
          className={styles.metricCard}
          data-active={segment === "Lost Leads" || undefined}
          onClick={() => setSegment("Lost Leads")}
          style={{ borderColor: segment !== "Lost Leads" && counts.lostLeads > 0 ? "rgba(230, 36, 41, 0.4)" : undefined }}
        >
          <span className={styles.metricLabel} style={{ color: "#ff4f54" }}>
            ❌ Lost Leads
          </span>
          <span className={styles.metricValue} style={{ color: "#ff4f54" }}>{counts.lostLeads}</span>
          <span className={styles.metricSubtext}>Did not continue</span>
        </button>

        <button
          type="button"
          className={styles.metricCard}
          data-active={segment === "All Members" || undefined}
          onClick={() => setSegment("All Members")}
        >
          <span className={styles.metricLabel}>
            👥 All Members
          </span>
          <span className={styles.metricValue}>{counts.all}</span>
          <span className={styles.metricSubtext}>Full directory</span>
        </button>
      </div>

      {/* ── Header Row (Page Title, Search, Filter Controls, Dual Action Buttons) ── */}
      <header className={styles.header}>
        <div className={styles.headerTitleGroup}>
          <h1>Members Directory</h1>
          <p>Manage studio members, active leads, subscriptions, and attendance roster.</p>
        </div>

        <div className={styles.headerControls}>
          {/* Search Box */}
          <div className={styles.search}>
            <Search size={16} />
            <input
              type="search"
              placeholder="Search members by name or phone..."
              defaultValue={searchValue}
              onChange={(e) => setQuery("q", e.target.value.trim() || undefined)}
            />
          </div>

          {/* Filter Pills */}
          <div className={styles.segments} aria-label="Filter directory contacts">
            <button
              type="button"
              data-active={segment === "Injuries" || undefined}
              onClick={() => setSegment(segment === "Injuries" ? "All Members" : "Injuries")}
            >
              ⚠️ Injuries ({counts.injuries})
            </button>
          </div>

          {/* Sort toggle */}
          <button
            type="button"
            className={styles.sortBtn}
            onClick={() => setQuery("sort", sortOrder === "asc" ? "desc" : "asc")}
            aria-label={sortOrder === "asc" ? "Sorted A to Z, click to sort Z to A" : "Sorted Z to A, click to sort A to Z"}
            title="Sort by name"
          >
            {sortOrder === "asc" ? <ArrowDownAZ size={16} /> : <ArrowUpAZ size={16} />}
            Name
          </button>

          {/* Explicit Dual Creation Actions */}
          <button type="button" className={styles.newLeadBtn} onClick={openCreateLead}>
            <Plus size={16} /> New Lead
          </button>
          <button type="button" className={styles.newBtn} onClick={openCreateMember}>
            <Plus size={16} /> New Member
          </button>
        </div>
      </header>

      {/* ── Main Card Grid Directory ── */}
      <section>
        {paginated.items.length ? (
          <div className={styles.cardsGrid}>
            {paginated.items.map((record) => {
              const type = clientType(record);
              const cardType = (() => {
                if (record.status === "Active" || record.subscriptionStatus === "Active") return "active-member";
                if (record.status === "Did not continue" || record.trialOutcome === "Did not continue") return "lost-lead";
                if (record.status === "Pending" || record.status === "Trial" || record.trialOutcome === "Follow up later" || record.trialOutcome === "Needs different option" || record.trialOutcome === "No response") return "active-lead";
                return "inactive-member";
              })();

              const isLeadCard = cardType === "active-lead" || cardType === "lost-lead";
              const injuryText = record.injuryNotes?.trim() || (record.injuryStatus !== "None" ? record.injuryStatus : "");

              return (
                <article
                  key={record.id}
                  className={styles.memberCard}
                  data-card-type={cardType}
                >
                  {/* Card Header: Avatar, Title, Phone, WhatsApp */}
                  <div className={styles.memberCardHeader}>
                    <div className={styles.memberCardMeta}>
                      <span className={styles.avatar}>{initials(record.fullName)}</span>
                      <div className={styles.memberCardNameGroup}>
                        <span className={styles.memberCardTitle}>{record.fullName}</span>
                        <span className={styles.memberCardPhone}>
                          <span>{formatPhoneNumber(record.phone)}</span>
                          {record.phone ? (
                            <a
                              href={buildWhatsAppHref(record.phone) ?? "#"}
                              target="_blank"
                              rel="noreferrer"
                              className={styles.waBtn}
                              title={`Send WhatsApp message to ${record.fullName}`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MessageCircle size={14} aria-hidden="true" />
                            </a>
                          ) : null}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Badges Row */}
                  <div className={styles.memberCardBadges}>
                    <span className={`${styles.statusPill} ${statusStyle(record.status)}`}>
                      {isLeadCard ? record.trialOutcome : record.status}
                    </span>
                    <span className={`${styles.typeBadge} ${type === "PRIVATE" ? styles.typeBadgePrivate : ""}`}>
                      {type}
                    </span>
                    {record.groups.length ? (
                      <span className={styles.groupChipRow}>
                        {record.groups.slice(0, 2).map((group) => (
                          <span key={group.id} className={styles.groupChip}>{group.name}</span>
                        ))}
                      </span>
                    ) : null}
                  </div>

                  {/* Essential Tailored Card Information Body */}
                  <div className={styles.memberCardBody}>
                    <div className={styles.memberCardInfoRow}>
                      <span className={styles.memberCardLabel}>Category</span>
                      <span className={styles.memberCardValue}>{record.trainingCategory}</span>
                    </div>
                    <div className={styles.memberCardInfoRow}>
                      <span className={styles.memberCardLabel}>Coach</span>
                      <span className={styles.memberCardValue}>{record.assignedCoach}</span>
                    </div>

                    {record.hasInjuryAlert || injuryText ? (
                      <span className={styles.injuryBadge}>
                        <TriangleAlert size={12} /> {injuryText || record.injuryStatus}
                      </span>
                    ) : null}
                  </div>

                  {/* Card Footer Actions */}
                  <div className={styles.memberCardFooter}>
                    <button
                      type="button"
                      className={styles.viewDetailsBtn}
                      onClick={() => setDetailId(record.id)}
                    >
                      View Details
                    </button>
                    <span className={styles.rowActions}>
                      <button
                        type="button"
                        className={styles.editRow}
                        onClick={() => openEdit(record)}
                        aria-label={`Edit ${record.fullName}`}
                        title="Edit record"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        className={styles.deleteRow}
                        onClick={() => openDelete(record)}
                        aria-label={`Delete ${record.fullName}`}
                        title="Delete record"
                      >
                        <Trash2 size={14} />
                      </button>
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className={styles.empty}>
            <Search size={30} />
            <h2>No contacts found</h2>
            <p>Change the filters or search term to find a member or lead.</p>
            <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
              <button className={styles.newLeadBtn} onClick={openCreateLead}>+ Add Lead</button>
              <button className={styles.newBtn} onClick={openCreateMember}>+ Add Member</button>
            </div>
          </div>
        )}

        <footer className={styles.pagination}>
          <span>
            Showing {paginated.startItem}-{paginated.endItem} of {filtered.length} visible ({filteredCount} matching {totalCount} total)
          </span>
          <div>
            <button
              type="button"
              disabled={paginated.page <= 1}
              onClick={() => setQuery("page", String(Math.max(1, paginated.page - 1)))}
            >
              <ChevronLeft size={16} /> Previous
            </button>
            <strong>{paginated.page} / {paginated.pageCount}</strong>
            <button
              type="button"
              disabled={paginated.page >= paginated.pageCount}
              onClick={() => setQuery("page", String(paginated.page + 1))}
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        </footer>
      </section>

      {/* ── Detail Drawer Modal ── */}
      <Dialog.Root open={!!detail} onOpenChange={(open) => !open && setDetailId(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className={styles.overlay} />
          <Dialog.Content className={styles.drawer}>
            <Dialog.Title className={styles.drawerTitle}>{detail?.fullName ?? "Member dossier"}</Dialog.Title>
            <Dialog.Description className={styles.drawerDescription}>{detail?.progressNote}</Dialog.Description>
            <Dialog.Close className={styles.close} aria-label="Close member details"><X size={18} /></Dialog.Close>

            {detail ? (
              <>
                <div className={styles.dossierHero}>
                  <span className={styles.avatar}>{initials(detail.fullName)}</span>
                  <div>
                    <small>{detail.membership}</small>
                    <strong>{detail.fullName}</strong>
                    <p>{detail.email || formatPhoneNumber(detail.phone)}</p>
                  </div>
                </div>

                <div className={styles.statusRow}>
                  <span className={statusStyle(detail.status)}>{detail.status}</span>
                  <span className={statusStyle(detail.paymentStatus)}>{detail.paymentStatus}</span>
                </div>

                <section className={styles.dossierSection}>
                  <h3>Membership</h3>
                  <dl>
                    <div><dt>Program</dt><dd>{detail.membership}</dd></div>
                    <div><dt>Training</dt><dd>{detail.trainingCategory}</dd></div>
                    <div><dt>Sport</dt><dd>{detail.sport || "—"}</dd></div>
                    <div><dt>Trial outcome</dt><dd>{detail.trialOutcome}</dd></div>
                    <div>
                      <dt>Groups</dt>
                      <dd>
                        {detail.groups.length ? (
                          <span className={styles.groupChipRow}>
                            {detail.groups.map((group) => (
                              <span key={group.id} className={styles.groupChip} title={`Coach: ${group.coachName}`}>{group.name}</span>
                            ))}
                          </span>
                        ) : "No group"}
                      </dd>
                    </div>
                    <div><dt>Coach</dt><dd>{detail.assignedCoach}</dd></div>
                    <div><dt>Payment</dt><dd>{detail.paymentAmountLabel}</dd></div>
                  </dl>
                </section>

                <section className={styles.dossierSection}>
                  <h3>
                    Injury &amp; restrictions
                    {detail.hasInjuryAlert ? <span style={{ color: "#f59e0b", marginLeft: 8 }}>⚠ {detail.injuryStatus}</span> : null}
                  </h3>
                  <dl>
                    <div><dt>Status</dt><dd>{detail.injuryStatus}</dd></div>
                    <div><dt>Injury notes</dt><dd>{detail.injuryNotes || "None recorded"}</dd></div>
                    <div><dt>Restrictions</dt><dd>{detail.restrictions || "None recorded"}</dd></div>
                  </dl>
                </section>

                <div className={styles.dossierTabs} role="tablist">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={historyTab === "receipts"}
                    className={styles.dossierTab}
                    data-active={historyTab === "receipts" || undefined}
                    onClick={() => setHistoryTab("receipts")}
                  >
                    <ReceiptText size={14} /> Receipts History ({detail.receipts.length})
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={historyTab === "attendance"}
                    className={styles.dossierTab}
                    data-active={historyTab === "attendance" || undefined}
                    onClick={() => setHistoryTab("attendance")}
                  >
                    <CalendarCheck size={14} /> Attendance History ({detail.attendanceHistory.length})
                  </button>
                </div>

                {historyTab === "receipts" ? (
                  <ClientReceiptHistory
                    clientName={detail.fullName}
                    receipts={detail.receipts.map((r) => ({
                      receiptNumber: r.receiptNumber,
                      clientId: detail.id,
                      clientName: detail.fullName,
                      clientPhone: detail.phone,
                      amount: Number(r.amountLabel.replace(/[^0-9.]/g, "")) || 0,
                      currency: "EGP",
                      paymentMethod: r.method,
                      paymentDate: r.dateLabel,
                      planName: detail.membership,
                      planType: detail.membership,
                      billingCycle: "Monthly",
                      durationMonths: 1,
                      sessionsIncluded: detail.sessionsTotal || 12,
                      coachName: detail.assignedCoach,
                      groupName: detail.groups[0]?.name ?? "No group",
                      paymentStatus: "PAID",
                    }))}
                  />
                ) : (
                  <ClientAttendanceHistory
                    clientName={detail.fullName}
                    history={detail.attendanceHistory}
                  />
                )}




                <div className={styles.drawerActions}>
                  {buildWhatsAppHref(detail.phone) ? (
                    <a className={styles.newBtn} style={{ background: "#161616", border: "1px solid #333" }} href={buildWhatsAppHref(detail.phone) ?? undefined} target="_blank" rel="noreferrer">
                      <MessageCircle size={16} /> Message
                    </a>
                  ) : null}
                  <button type="button" className={styles.newBtn} onClick={() => { setDetailId(null); openEdit(detail); }}>
                    <Pencil size={16} /> Edit member
                  </button>
                </div>
              </>
            ) : null}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* ── Edit / Create Modal (Tailored for Lead vs Member) ── */}
      <EntityDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        title={isLeadModal ? (editingId ? "Edit Lead" : "Add a New Lead") : (editingId ? "Edit Member" : "Add a New Member")}
        description={isLeadModal ? "Manage lead inquiries, trial session outcome, and follow-up notes." : "Update studio member details, category, and group assignment."}
        closeLabel="Close editor"
      >
        <EntityForm onSubmit={submitClient}>
          <FormField label="Full name" required full>
            <input required value={form.fullName} onChange={(event) => setForm((value) => ({ ...value, fullName: event.target.value }))} />
          </FormField>
          <FormField label="Phone" full={isLeadModal}>
            <input type="tel" placeholder="+20 100 000 0000" value={form.phone} onChange={(event) => setForm((value) => ({ ...value, phone: event.target.value }))} />
          </FormField>

          {isLeadModal ? (
            <>
              <FormField label="Lead / Trial status">
                <select
                  value={form.trialOutcome}
                  onChange={(event) => setForm((value) => ({ ...value, trialOutcome: event.target.value as ClientForm["trialOutcome"] }))}
                >
                  {trialOutcomeLabels.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </FormField>
              <FormField label="Category interest" required>
                <select
                  required
                  value={form.categoryId}
                  onChange={(event) => setForm((value) => ({ ...value, categoryId: event.target.value }))}
                >
                  <option value="" disabled>Choose a category</option>
                  {categoryOptions.map((category) => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </FormField>
              <FormField label="Notes &amp; inquiry details" full>
                <input
                  value={form.injuryNotes}
                  onChange={(event) => setForm((value) => ({ ...value, injuryNotes: event.target.value }))}
                  placeholder="Trial preferences, referral source, or health notes"
                />
              </FormField>
            </>
          ) : (
            <>
              <FormField label="Membership status">
                <select value={form.status} onChange={(event) => setForm((value) => ({ ...value, status: event.target.value as ClientForm["status"] }))}>
                  <option value="Active">Active</option>
                  <option value="Paused">Paused</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </FormField>
              <FormField label="Training category" required>
                <select required value={form.categoryId} onChange={(event) => setForm((value) => ({ ...value, categoryId: event.target.value, groupId: "" }))}>
                  <option value="" disabled>Choose a category</option>
                  {categoryOptions.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                </select>
              </FormField>
              <FormField label="Group">
                <select value={form.groupId} onChange={(event) => setForm((value) => ({ ...value, groupId: event.target.value }))}>
                  <option value="">No group</option>
                  {groupsInFormCategory.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}
                </select>
              </FormField>
              <FormField label="Injury &amp; health notes" full>
                <input
                  value={form.injuryNotes}
                  onChange={(event) => setForm((value) => ({
                    ...value,
                    injuryNotes: event.target.value,
                    injuryStatus: event.target.value.trim() ? "Current injury" : "None"
                  }))}
                  placeholder="Current or previous injury details for coaches"
                />
              </FormField>
            </>
          )}

          {error ? <FormErrorBanner>{error}</FormErrorBanner> : null}
          <FormActions
            onCancel={() => setEditorOpen(false)}
            onDelete={editingId ? () => { setDeleteText(""); setDeleteOpen(true); } : undefined}
            submitLabel={isLeadModal ? "Save lead" : "Save member"}
            pendingLabel="Saving…"
            pending={isPending}
          />
        </EntityForm>
      </EntityDialog>

      {/* ── Confirm Delete Modal ── */}
      <ConfirmDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete this member?"
        description="This removes the account and connected operational records. Type Delete to continue."
        confirmationValue={deleteText}
        onConfirmationChange={setDeleteText}
        error={error}
        pending={isPending}
        onConfirm={confirmDelete}
        closeLabel="Close delete confirmation"
      />
    </div>
  );
}
