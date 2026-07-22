"use client";

import { useEffect, useMemo, useState, useTransition, type FormEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Dialog } from "radix-ui";
import {
  ArrowDownAZ,
  ArrowUpAZ,
  ChevronLeft,
  ChevronRight,
  KeyRound,
  MessageCircle,
  Pencil,
  Plus,
  Search,
  TriangleAlert,
  Trash2,
  X,
} from "lucide-react";

import { issueAccountPasswordResetLink } from "@/app/actions/account-security";
import { deleteAdminClient, saveAdminClient } from "@/app/actions/admin-clients";
import type { AdminClientInitialOption, AdminClientRecord } from "@/lib/dashboard/admin-dashboard-data";
import {
  injuryStatusLabels,
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
import {
  PasswordResetLinkDialog,
  type PasswordResetLink,
} from "./password-reset-link-dialog";
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
  email: string;
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
  email: "",
  phone: "",
  status: "Pending",
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

const clientSegments = ["All", "Active", "Trial", "Paused", "Inactive", "Injuries"] as const;

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
  if (["Paused"].includes(status)) return styles.statusPaused;
  if (["Trial", "Pending", "Expiring", "Due soon"].includes(status)) return styles.statusTrial;
  return styles.statusInactive;
}

import { ClientReceiptHistory } from "./client-receipt-history";

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
  const [segment, setSegment] = useState<(typeof clientSegments)[number]>("All");
  const [detailId, setDetailId] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteText, setDeleteText] = useState("");
  const [form, setForm] = useState<ClientForm>(emptyForm);
  const [error, setError] = useState("");
  const [resetLink, setResetLink] = useState<PasswordResetLink | null>(null);
  const [resetError, setResetError] = useState("");

  const filtered = useMemo(() => {
    return records.filter((record) => {
      const matchesSegment =
        segment === "All" ||
        (segment === "Injuries"
          ? record.hasInjuryAlert
          : (segment as string) === "Expiring"
            ? record.subscriptionStatus === "Expiring"
            : record.status === segment);

      return matchesSegment;
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

  function openCreate() {
    setEditingId(null);
    setForm({ ...emptyForm, categoryId: categoryOptions[0]?.id ?? "" });
    setError("");
    setEditorOpen(true);
  }

  function openEdit(record: AdminClientRecord) {
    setEditingId(record.id);
    setForm({
      fullName: record.fullName,
      email: record.email,
      phone: record.phone,
      status: record.status,
      trialOutcome: record.trialOutcome,
      paymentStatus: record.paymentStatus,
      paymentAmount: record.paymentAmountLabel.replace(/[^0-9.]/g, ""),
      groupId: record.primaryGroupId ?? "",
      categoryId: record.categoryId ?? groupOptions.find((group) => group.id === record.primaryGroupId)?.categoryId ?? categoryOptions[0]?.id ?? "",
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
          email: form.email || undefined,
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
        showToast(editingId ? "Member updated." : "Member added.");
        router.refresh();
      } catch (caught) {
        const description = caught instanceof Error ? caught.message : "Could not save the member.";
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
        showToast("Member deleted.");
        router.refresh();
      } catch (caught) {
        const description = caught instanceof Error ? caught.message : "Could not delete the member.";
        setError(description);
        showToast(description, "warning");
      }
    });
  }

  function issueResetLink(record: AdminClientRecord) {
    setResetError("");
    startTransition(async () => {
      try {
        const result = await issueAccountPasswordResetLink({
          profileId: record.id,
          profileType: "client",
        });
        setDetailId(null);
        setResetLink({
          accountName: record.fullName,
          accountType: "client",
          expiresAt: result.expiresAt,
          url: new URL(result.path, window.location.origin).toString(),
        });
      } catch (caught) {
        setResetError(caught instanceof Error ? caught.message : "Could not issue a reset link.");
      }
    });
  }

  return (
    <div className={styles.page} aria-busy={isPending}>
      {/* ── Header Row (Filter Chips, + New Client) ── */}
      <header className={styles.header}>
        <div className={styles.headerControls}>
          {/* Segment Filter Chips */}
          <div className={styles.segments} aria-label="Filter members by status segment">
            {clientSegments.map((option) => (
              <button
                key={option}
                type="button"
                data-active={segment === option || undefined}
                onClick={() => setSegment(option)}
              >
                {option}
              </button>
            ))}
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

          {/* New Client Button */}
          <button type="button" className={styles.newBtn} onClick={openCreate}>
            <Plus size={16} /> New client
          </button>
        </div>
      </header>

      {/* ── Main Table ── */}
      <section className={styles.roster}>
        {paginated.items.length ? (
          <div className={styles.rosterTable}>
            <div className={styles.rosterHead}>
              <span>Client</span>
              <span>Category</span>
              <span>Type</span>
              <span>Coach</span>
              <span>Status</span>
              <span>Phone</span>
              <span />
            </div>

            {paginated.items.map((record) => {
              const type = clientType(record);
              const injuryText = record.injuryNotes?.trim() || (record.injuryStatus !== "None" ? record.injuryStatus : "");

              return (
                <article
                  className={styles.rosterRow}
                  data-subdued={record.subscriptionStatus === "Inactive" || undefined}
                  key={record.id}
                >
                  {/* CLIENT */}
                  <button
                    type="button"
                    className={styles.clientCell}
                    onClick={() => setDetailId(record.id)}
                    aria-label={`Open ${record.fullName}`}
                  >
                    <span className={styles.avatar}>{initials(record.fullName)}</span>
                    <span className={styles.nameCol}>
                      <span className={styles.clientName}>{record.fullName}</span>
                      {record.hasInjuryAlert || injuryText ? (
                        <span className={styles.injuryBadge}>
                          <TriangleAlert size={12} /> {injuryText || record.injuryStatus}
                        </span>
                      ) : null}
                    </span>
                  </button>

                  {/* CATEGORY */}
                  <span className={styles.categoryText}>{record.trainingCategory}</span>

                  {/* TYPE */}
                  <div>
                    <span className={`${styles.typeBadge} ${type === "PRIVATE" ? styles.typeBadgePrivate : ""}`}>
                      {type}
                    </span>
                  </div>

                  {/* COACH */}
                  <span className={styles.coachText}>{record.assignedCoach}</span>

                  {/* STATUS */}
                  <div>
                    <span className={`${styles.statusPill} ${statusStyle(record.status)}`}>
                      {record.status}
                    </span>
                  </div>

                  {/* PHONE */}
                  <span className={styles.phoneText}>{formatPhoneNumber(record.phone)}</span>

                  {/* ACTIONS */}
                  <span className={styles.rowActions}>
                    <button
                      type="button"
                      className={styles.editRow}
                      onClick={() => openEdit(record)}
                      aria-label={`Edit ${record.fullName}`}
                      title="Edit member"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      className={styles.deleteRow}
                      onClick={() => openDelete(record)}
                      aria-label={`Delete ${record.fullName}`}
                      title="Delete member"
                    >
                      <Trash2 size={14} />
                    </button>
                  </span>
                </article>
              );
            })}
          </div>
        ) : (
          <div className={styles.empty}>
            <Search size={30} />
            <h2>No clients found</h2>
            <p>Change the filters or search term to find a client.</p>
            <button className={styles.newBtn} onClick={openCreate}>Add client</button>
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
                    <div><dt>Group</dt><dd>{detail.primaryGroup}</dd></div>
                    <div><dt>Coach</dt><dd>{detail.assignedCoach}</dd></div>
                    <div><dt>Payment</dt><dd>{detail.paymentAmountLabel}</dd></div>
                  </dl>
                </section>

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
                    groupName: detail.primaryGroup,
                    paymentStatus: "PAID",
                  }))}
                />

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

                <section className={styles.dossierSection}>
                  <h3>Next sessions</h3>
                  {detail.nextSessions.length ? (
                    <ol>{detail.nextSessions.slice(0, 3).map((session) => <li key={session}>{session}</li>)}</ol>
                  ) : (
                    <p>{detail.nextSession}</p>
                  )}
                </section>

                {resetError ? <p className={styles.error} role="alert">{resetError}</p> : null}

                <div className={styles.drawerActions}>
                  {buildWhatsAppHref(detail.phone) ? (
                    <a className={styles.newBtn} style={{ background: "#161616", border: "1px solid #333" }} href={buildWhatsAppHref(detail.phone) ?? undefined} target="_blank" rel="noreferrer">
                      <MessageCircle size={16} /> Message
                    </a>
                  ) : null}
                  <button type="button" className={styles.newBtn} style={{ background: "#161616", border: "1px solid #333" }} disabled={isPending} onClick={() => issueResetLink(detail)}>
                    <KeyRound size={16} /> Reset access
                  </button>
                  <button type="button" className={styles.newBtn} onClick={() => { setDetailId(null); openEdit(detail); }}>
                    <Pencil size={16} /> Edit member
                  </button>
                </div>
              </>
            ) : null}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* ── Edit / Create Modal ── */}
      <EntityDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        title={editingId ? "Edit member" : "Add a new member"}
        description="Update the roster record and account state."
        closeLabel="Close editor"
      >
        <EntityForm onSubmit={submitClient}>
          <FormField label="Full name" required full>
            <input required value={form.fullName} onChange={(event) => setForm((value) => ({ ...value, fullName: event.target.value }))} />
          </FormField>
          <FormField label="Email">
            <input type="email" value={form.email} onChange={(event) => setForm((value) => ({ ...value, email: event.target.value }))} />
          </FormField>
          <FormField label="Phone">
            <input type="tel" placeholder="+20 100 000 0000" value={form.phone} onChange={(event) => setForm((value) => ({ ...value, phone: event.target.value }))} />
          </FormField>
          <FormField label="Status">
            <select value={form.status} onChange={(event) => setForm((value) => ({ ...value, status: event.target.value as ClientForm["status"] }))}>
              <option value="Active">Active</option>
              <option value="Trial">Trial</option>
              <option value="Paused">Paused</option>
              <option value="Inactive">Inactive</option>
              <option value="Pending">Pending</option>
            </select>
          </FormField>
          <FormField label="Trial outcome">
            <select value={form.trialOutcome} onChange={(event) => setForm((value) => ({ ...value, trialOutcome: event.target.value as ClientForm["trialOutcome"] }))}>{trialOutcomeLabels.map((item) => <option key={item}>{item}</option>)}</select>
          </FormField>
          <FormField label="Payment">
            <select value={form.paymentStatus} onChange={(event) => setForm((value) => ({ ...value, paymentStatus: event.target.value as ClientForm["paymentStatus"] }))}>
              <option value="Paid">Paid</option>
              <option value="Unpaid">Unpaid</option>
              <option value="Due soon">Due soon</option>
            </select>
          </FormField>
          <FormField label="Amount">
            <input inputMode="decimal" value={form.paymentAmount} onChange={(event) => setForm((value) => ({ ...value, paymentAmount: event.target.value }))} />
          </FormField>
          <FormField label="Training category">
            <select required value={form.categoryId} onChange={(event) => setForm((value) => ({ ...value, categoryId: event.target.value, groupId: "" }))}>
              <option value="" disabled>Choose a category</option>
              {categoryOptions.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
          </FormField>
          <FormField label="Group">
            <select value={form.groupId} onChange={(event) => setForm((value) => ({ ...value, groupId: event.target.value }))}>
              <option value="">No group</option>
              {groupOptions.filter((group) => group.categoryId === form.categoryId).map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}
            </select>
          </FormField>
          <FormField label="Sport (optional)">
            <input value={form.sport} onChange={(event) => setForm((value) => ({ ...value, sport: event.target.value }))} placeholder="e.g. Football" />
          </FormField>
          <FormField label="Injury status">
            <select value={form.injuryStatus} onChange={(event) => setForm((value) => ({ ...value, injuryStatus: event.target.value as ClientForm["injuryStatus"] }))}>{injuryStatusLabels.map((item) => <option key={item}>{item}</option>)}</select>
          </FormField>
          <FormField label="Injury notes" full>
            <input value={form.injuryNotes} onChange={(event) => setForm((value) => ({ ...value, injuryNotes: event.target.value }))} placeholder="Current or previous injury the coach must know about" />
          </FormField>
          <FormField label="Exercise restrictions" full>
            <input value={form.restrictions} onChange={(event) => setForm((value) => ({ ...value, restrictions: event.target.value }))} placeholder="Movements or loads to avoid" />
          </FormField>
          {error ? <FormErrorBanner>{error}</FormErrorBanner> : null}
          <FormActions
            onCancel={() => setEditorOpen(false)}
            onDelete={editingId ? () => { setDeleteText(""); setDeleteOpen(true); } : undefined}
            submitLabel="Save member"
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
      <PasswordResetLinkDialog resetLink={resetLink} onClose={() => setResetLink(null)} />
    </div>
  );
}
