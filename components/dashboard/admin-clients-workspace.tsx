"use client";

import { useEffect, useMemo, useState, useTransition, type FormEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Dialog } from "radix-ui";
import {
  ArrowDownAZ,
  ArrowUpAZ,
  ChevronLeft,
  ChevronRight,
  Download,
  KeyRound,
  MessageCircle,
  Pencil,
  Plus,
  ReceiptText,
  RefreshCcw,
  Search,
  Trash2,
  X,
} from "lucide-react";

import { issueAccountPasswordResetLink } from "@/app/actions/account-security";
import { deleteAdminClient, saveAdminClient } from "@/app/actions/admin-clients";
import type { AdminClientInitialOption, AdminClientRecord } from "@/lib/dashboard/admin-dashboard-data";
import {
  adminClientMembershipFilters,
  adminClientStatusFilters,
  adminPaymentStatusFilters,
  adminTrainingCategoryFilters,
} from "@/lib/dashboard/admin-dashboard-data";
import {
  injuryStatusLabels,
  trainingCategoryLabels,
  trialOutcomeLabels,
} from "@/lib/dashboard/client-domain-labels";
import { paginateDashboardItems } from "@/lib/dashboard/pagination";
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
  groupOptions: Array<{ id: string; name: string }>;
};

type LocalFilters = {
  status: (typeof adminClientStatusFilters)[number];
  membership: (typeof adminClientMembershipFilters)[number];
  payment: (typeof adminPaymentStatusFilters)[number];
  category: (typeof adminTrainingCategoryFilters)[number];
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
  trainingCategory: AdminClientRecord["trainingCategory"];
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
  trainingCategory: "General fitness",
  sport: "",
  injuryStatus: "None",
  injuryNotes: "",
  restrictions: "",
};

const clientSegments = ["All", "Active", "Expiring", "Trial", "Paused", "Inactive", "Injuries"] as const;

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

function tone(status: string) {
  if (["Active", "Paid"].includes(status)) return styles.success;
  if (["Pending", "Due soon", "Trial", "Expiring"].includes(status)) return styles.warning;
  return styles.neutral;
}

function ReceiptHistory({ receipts }: { receipts: AdminClientRecord["receipts"] }) {
  return <section className={styles.dossierSection}>
    <h3>Receipts</h3>
    {receipts.length ? <div className={styles.receiptList}>{receipts.map((receipt) => (
      <div className={styles.receiptRow} key={receipt.id}>
        <a className={styles.receiptLink} href={receipt.href} target="_blank" rel="noreferrer">
          <span><strong>{receipt.receiptNumber}</strong><small>{receipt.dateLabel} · {receipt.method}</small></span>
          <b>{receipt.amountLabel}<ReceiptText size={14} /></b>
        </a>
        <a className={styles.receiptSave} href={`${receipt.href}?download=1`} download aria-label={`Save receipt ${receipt.receiptNumber} to your computer`} title="Save receipt">
          <Download size={14} />
        </a>
      </div>
    ))}</div> : <p>No receipts recorded yet.</p>}
  </section>;
}

export function AdminClientsWorkspace({
  records,
  searchValue,
  selectedInitial,
  sortOrder,
  currentPage,
  totalCount,
  filteredCount,
  initialOptions,
  groupOptions,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { showToast } = useDashboardToast();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(searchValue);
  const [filters, setFilters] = useState<LocalFilters>({ status: "All", membership: "All", payment: "All", category: "All" });
  const [detailId, setDetailId] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteText, setDeleteText] = useState("");
  const [form, setForm] = useState<ClientForm>(emptyForm);
  const [error, setError] = useState("");
  const [resetLink, setResetLink] = useState<PasswordResetLink | null>(null);
  const [resetError, setResetError] = useState("");

  const [segment, setSegment] = useState<(typeof clientSegments)[number]>("All");

  const filtered = useMemo(() => records.filter((record) =>
    (filters.status === "All" || record.status === filters.status) &&
    (filters.membership === "All" || record.membership === filters.membership) &&
    (filters.payment === "All" || record.paymentStatus === filters.payment) &&
    (filters.category === "All" || record.trainingCategory === filters.category) &&
    (segment === "All" ||
      (segment === "Injuries"
        ? record.hasInjuryAlert
        : segment === "Expiring"
          ? record.subscriptionStatus === "Expiring"
          : record.status === segment))
  ), [records, filters, segment]);

  const summary = useMemo(() => ({
    total: records.length,
    active: records.filter((record) => record.status === "Active").length,
    trial: records.filter((record) => record.status === "Trial").length,
    injuries: records.filter((record) => record.hasInjuryAlert).length,
    expiring: records.filter((record) => record.subscriptionStatus === "Expiring").length,
  }), [records]);
  const paginated = paginateDashboardItems(filtered, currentPage);
  const detail = records.find((record) => record.id === detailId) ?? null;
  const editing = records.find((record) => record.id === editingId) ?? null;

  useEffect(() => {
    if (searchParams.get("new") !== "1") return;
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setEditorOpen(true);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("new");
    window.history.replaceState(
      null,
      "",
      params.size ? `${pathname}?${params.toString()}` : pathname,
    );
  }, [pathname, router, searchParams]);

  function setQuery(key: string, value?: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value); else params.delete(key);
    if (key !== "page") params.delete("page");
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  }

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
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
      paymentAmount: record.paymentAmountLabel === "No payment yet" ? "" : record.paymentAmountLabel.replace(/^EGP\s*/, ""),
      groupId: record.primaryGroupId ?? "",
      trainingCategory: record.trainingCategory,
      sport: record.sport,
      injuryStatus: record.injuryStatus,
      injuryNotes: record.injuryNotes,
      restrictions: record.restrictions,
    });
    setError("");
    setEditorOpen(true);
  }

  function submitSearch(event: FormEvent) {
    event.preventDefault();
    setQuery("q", search.trim() || undefined);
  }

  function submitClient(event: FormEvent) {
    event.preventDefault();
    setError("");
    startTransition(async () => {
      try {
        await saveAdminClient({ clientId: editingId, ...form });
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
      <section className={styles.summary} aria-label="Client summary">
        <article><span>Total</span><strong>{summary.total}</strong></article>
        <article><span>Active</span><strong>{summary.active}</strong></article>
        <article data-tone="warning"><span>Expiring soon</span><strong>{summary.expiring}</strong></article>
        <article><span>On trial</span><strong>{summary.trial}</strong></article>
        <article data-tone="warning"><span>Injuries</span><strong>{summary.injuries}</strong></article>
      </section>

      <div className={styles.segments} aria-label="Filter members by segment">
        {clientSegments.map((option) => (
          <button key={option} type="button" data-active={segment === option || undefined} onClick={() => setSegment(option)}>{option}</button>
        ))}
      </div>

      <section className={styles.roster}>
        <header className={styles.rosterToolbar}>
          <div><h2>Client roster</h2><p>Know every member</p></div>
          <form onSubmit={submitSearch} className={styles.search}><Search size={18} /><label className="sr-only" htmlFor="member-search">Search members</label><input id="member-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name, member ID, phone or coach" /><button type="submit">Search</button></form>
          <div className={styles.filters}>
            <label>Status<select value={filters.status} onChange={(event) => setFilters((value) => ({ ...value, status: event.target.value as LocalFilters["status"] }))}>{adminClientStatusFilters.map((option) => <option key={option}>{option}</option>)}</select></label>
            <label>Plan<select value={filters.membership} onChange={(event) => setFilters((value) => ({ ...value, membership: event.target.value as LocalFilters["membership"] }))}>{adminClientMembershipFilters.map((option) => <option key={option}>{option}</option>)}</select></label>
            <label>Training<select value={filters.category} onChange={(event) => setFilters((value) => ({ ...value, category: event.target.value as LocalFilters["category"] }))}>{adminTrainingCategoryFilters.map((option) => <option key={option}>{option}</option>)}</select></label>
            <label>Payment<select value={filters.payment} onChange={(event) => setFilters((value) => ({ ...value, payment: event.target.value as LocalFilters["payment"] }))}>{adminPaymentStatusFilters.map((option) => <option key={option}>{option}</option>)}</select></label>
            <button type="button" className={styles.sort} aria-label={`Sort ${sortOrder === "asc" ? "descending" : "ascending"}`} onClick={() => setQuery("sort", sortOrder === "asc" ? "desc" : "asc")}>{sortOrder === "asc" ? <ArrowDownAZ size={19} /> : <ArrowUpAZ size={19} />}</button>
          </div>
          <button type="button" className="mv-btn mv-btn-primary" onClick={openCreate}><Plus size={17} /> New client</button>
        </header>

        <div className={styles.initials} aria-label="Filter members by initial">
          <button type="button" data-active={!selectedInitial || undefined} onClick={() => setQuery("initial")}>All</button>
          {initialOptions.map((option) => <button key={option.label} type="button" data-active={selectedInitial === option.label || undefined} onClick={() => setQuery("initial", option.label)}><span>{option.label}</span><small>{option.count}</small></button>)}
        </div>

        {paginated.items.length ? (
          <div className={styles.rosterTable}>
            <div className={styles.rosterHead}><span>Client</span><span>Category</span><span>Coach</span><span>Sessions left</span><span>Status</span><span>Phone</span><span /></div>
            {paginated.items.map((record) => (
              <article
                className={styles.rosterRow}
                data-subdued={record.subscriptionStatus === "Inactive" || undefined}
                key={record.id}
              >
                <button type="button" className={styles.clientCell} onClick={() => setDetailId(record.id)} aria-label={`Open ${record.fullName}`}><span className={styles.avatar}>{initials(record.fullName)}</span><span><strong>{record.fullName}</strong>{record.hasInjuryAlert ? <small className={styles.warning}>⚠ {record.injuryStatus}</small> : <small>{record.phone}</small>}</span></button>
                <span className={styles.stack}><strong>{record.trainingCategory}</strong><small>{record.membership}</small></span>
                <span className={styles.coachCell}><i>{initials(record.assignedCoach)}</i>{record.assignedCoach}</span>
                <span className={styles.sessions}><strong>{record.sessionsLeft}</strong><small>of {record.sessionsTotal}</small><em><b style={{ width: `${Math.min(100, record.sessionsTotal ? (record.sessionsLeft / record.sessionsTotal) * 100 : 0)}%` }} /></em></span>
                <span className={styles.stack}>
                  <span className={`${styles.state} ${tone(record.status)}`}>{record.status}</span>
                  <small className={tone(record.subscriptionStatus)}>
                    {record.subscriptionStatus === "Expiring" && record.subscriptionDaysRemaining != null
                      ? `Expiring in ${record.subscriptionDaysRemaining}d`
                      : record.subscriptionStatus}
                  </small>
                </span>
                <span className={styles.phone}>{record.phone || "—"}</span>
                <span className={styles.rowActions}>
                  {record.subscriptionStatus === "Inactive" ? (
                    <>
                      <a
                        className={styles.editRow}
                        href={`/admin/subscriptions?client=${record.id}`}
                        aria-label={`Renew ${record.fullName}`}
                        title="Renew subscription"
                      >
                        <RefreshCcw size={15} />
                      </a>
                      <a
                        className={styles.editRow}
                        href={record.receipts[0]?.href ?? "#"}
                        aria-disabled={!record.receipts[0] || undefined}
                        onClick={(event) => { if (!record.receipts[0]) event.preventDefault(); }}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`Last receipt for ${record.fullName}`}
                        title="Last receipt"
                      >
                        <ReceiptText size={15} />
                      </a>
                    </>
                  ) : null}
                  <button type="button" className={styles.editRow} onClick={() => openEdit(record)} aria-label={`Edit ${record.fullName}`}><Pencil size={15} /></button>
                  <button type="button" className={styles.deleteRow} onClick={() => openDelete(record)} aria-label={`Delete ${record.fullName}`}><Trash2 size={15} /></button>
                </span>
              </article>
            ))}
          </div>
        ) : <div className={styles.empty}><Search size={30} /><h2>No clients found</h2><p>Change the filters or add the first matching client.</p><button className="mv-btn mv-btn-primary" onClick={openCreate}>Add client</button></div>}

        <footer className={styles.pagination}><span>Showing {paginated.startItem}-{paginated.endItem} of {filtered.length} visible ({filteredCount} matching {totalCount} total)</span><div><button type="button" disabled={paginated.page <= 1} onClick={() => setQuery("page", String(Math.max(1, paginated.page - 1)))}><ChevronLeft size={17} /> Previous</button><strong>{paginated.page} / {paginated.pageCount}</strong><button type="button" disabled={paginated.page >= paginated.pageCount} onClick={() => setQuery("page", String(paginated.page + 1))}>Next <ChevronRight size={17} /></button></div></footer>
      </section>

      <Dialog.Root open={!!detail} onOpenChange={(open) => !open && setDetailId(null)}>
        <Dialog.Portal><Dialog.Overlay className={styles.overlay} /><Dialog.Content className={styles.drawer}>
          <Dialog.Title className={styles.drawerTitle}>{detail?.fullName ?? "Member dossier"}</Dialog.Title><Dialog.Description className={styles.drawerDescription}>{detail?.progressNote}</Dialog.Description>
          <Dialog.Close className={styles.close} aria-label="Close member details"><X size={18} /></Dialog.Close>
          {detail ? <><div className={styles.dossierHero}><span className={styles.avatar}>{initials(detail.fullName)}</span><div><small>{detail.membership}</small><strong>{detail.fullName}</strong><p>{detail.email || detail.phone}</p></div></div><div className={styles.statusRow}><span className={tone(detail.status)}>{detail.status}</span><span className={tone(detail.paymentStatus)}>{detail.paymentStatus}</span></div><section className={styles.dossierSection}><h3>Membership</h3><dl><div><dt>Program</dt><dd>{detail.membership}</dd></div><div><dt>Training</dt><dd>{detail.trainingCategory}</dd></div><div><dt>Sport</dt><dd>{detail.sport || "—"}</dd></div><div><dt>Trial outcome</dt><dd>{detail.trialOutcome}</dd></div><div><dt>Group</dt><dd>{detail.primaryGroup}</dd></div><div><dt>Coach</dt><dd>{detail.assignedCoach}</dd></div><div><dt>Payment</dt><dd>{detail.paymentAmountLabel}</dd></div></dl></section><ReceiptHistory receipts={detail.receipts} /><section className={styles.dossierSection}><h3>Injury &amp; restrictions{detail.hasInjuryAlert ? <span className={styles.warning}>⚠ {detail.injuryStatus}</span> : null}</h3><dl><div><dt>Status</dt><dd>{detail.injuryStatus}</dd></div><div><dt>Injury notes</dt><dd>{detail.injuryNotes || "None recorded"}</dd></div><div><dt>Restrictions</dt><dd>{detail.restrictions || "None recorded"}</dd></div></dl></section><section className={styles.dossierSection}><h3>Next sessions</h3>{detail.nextSessions.length ? <ol>{detail.nextSessions.slice(0, 3).map((session) => <li key={session}>{session}</li>)}</ol> : <p>{detail.nextSession}</p>}</section>{resetError ? <p className={styles.error} role="alert">{resetError}</p> : null}<div className={styles.drawerActions}>{buildWhatsAppHref(detail.phone) ? <a className="mv-btn mv-btn-secondary" href={buildWhatsAppHref(detail.phone) ?? undefined} target="_blank" rel="noreferrer"><MessageCircle size={17} /> Message</a> : null}<button type="button" className="mv-btn mv-btn-secondary" disabled={isPending} onClick={() => issueResetLink(detail)}><KeyRound size={17} /> Reset access</button><button type="button" className="mv-btn mv-btn-primary" onClick={() => { setDetailId(null); openEdit(detail); }}><Pencil size={17} /> Edit member</button></div></> : null}
        </Dialog.Content></Dialog.Portal>
      </Dialog.Root>

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
            <input type="tel" value={form.phone} onChange={(event) => setForm((value) => ({ ...value, phone: event.target.value }))} />
          </FormField>
          <FormField label="Status">
            <select value={form.status} onChange={(event) => setForm((value) => ({ ...value, status: event.target.value as ClientForm["status"] }))}>{adminClientStatusFilters.filter((item) => item !== "All").map((item) => <option key={item}>{item}</option>)}</select>
          </FormField>
          <FormField label="Trial outcome">
            <select value={form.trialOutcome} onChange={(event) => setForm((value) => ({ ...value, trialOutcome: event.target.value as ClientForm["trialOutcome"] }))}>{trialOutcomeLabels.map((item) => <option key={item}>{item}</option>)}</select>
          </FormField>
          <FormField label="Payment">
            <select value={form.paymentStatus} onChange={(event) => setForm((value) => ({ ...value, paymentStatus: event.target.value as ClientForm["paymentStatus"] }))}>{adminPaymentStatusFilters.filter((item) => item !== "All").map((item) => <option key={item}>{item}</option>)}</select>
          </FormField>
          <FormField label="Amount">
            <input inputMode="decimal" value={form.paymentAmount} onChange={(event) => setForm((value) => ({ ...value, paymentAmount: event.target.value }))} />
          </FormField>
          <FormField label="Group">
            <select value={form.groupId} onChange={(event) => setForm((value) => ({ ...value, groupId: event.target.value }))}><option value="">No group</option>{groupOptions.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}</select>
          </FormField>
          <FormField label="Training category">
            <select value={form.trainingCategory} onChange={(event) => setForm((value) => ({ ...value, trainingCategory: event.target.value as ClientForm["trainingCategory"] }))}>{trainingCategoryLabels.map((item) => <option key={item}>{item}</option>)}</select>
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
