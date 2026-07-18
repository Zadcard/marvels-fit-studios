"use client";

import { useMemo, useState, useTransition, type FormEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Dialog } from "radix-ui";
import {
  ArrowDownAZ,
  ArrowUpAZ,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  Pencil,
  Plus,
  ReceiptText,
  Search,
  Trash2,
  X,
} from "lucide-react";

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

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

function tone(status: string) {
  if (["Active", "Paid"].includes(status)) return styles.success;
  if (["Pending", "Due soon", "Trial"].includes(status)) return styles.warning;
  return styles.neutral;
}

function ReceiptHistory({ receipts }: { receipts: AdminClientRecord["receipts"] }) {
  return <section className={styles.dossierSection}>
    <h3>Receipts</h3>
    {receipts.length ? <div className={styles.receiptList}>{receipts.map((receipt) => (
      <a className={styles.receiptLink} href={receipt.href} key={receipt.id} target="_blank" rel="noreferrer">
        <span><strong>{receipt.receiptNumber}</strong><small>{receipt.dateLabel} · {receipt.method}</small></span>
        <b>{receipt.amountLabel}<ReceiptText size={14} /></b>
      </a>
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

  const filtered = useMemo(() => records.filter((record) =>
    (filters.status === "All" || record.status === filters.status) &&
    (filters.membership === "All" || record.membership === filters.membership) &&
    (filters.payment === "All" || record.paymentStatus === filters.payment) &&
    (filters.category === "All" || record.trainingCategory === filters.category)
  ), [records, filters]);
  const paginated = paginateDashboardItems(filtered, currentPage);
  const detail = records.find((record) => record.id === detailId) ?? null;
  const editing = records.find((record) => record.id === editingId) ?? null;

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
        router.refresh();
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Could not save the member.");
      }
    });
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
        router.refresh();
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Could not delete the member.");
      }
    });
  }

  return (
    <div className={styles.page} aria-busy={isPending}>
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
            <div className={styles.rosterHead}><span>Client</span><span>Category</span><span>Coach</span><span>Status</span><span>Phone</span><span /></div>
            {paginated.items.map((record) => (
              <article className={styles.rosterRow} key={record.id}>
                <button type="button" className={styles.clientCell} onClick={() => setDetailId(record.id)} aria-label={`Open ${record.fullName}`}><span className={styles.avatar}>{initials(record.fullName)}</span><span><strong>{record.fullName}</strong>{record.hasInjuryAlert ? <small className={styles.warning}>⚠ {record.injuryStatus}</small> : <small>{record.clientId}</small>}</span></button>
                <span className={styles.stack}><strong>{record.trainingCategory}</strong><small>{record.membership}</small></span>
                <span className={styles.coachCell}><i>{initials(record.assignedCoach)}</i>{record.assignedCoach}</span>
                <span className={`${styles.state} ${tone(record.status)}`}>{record.status}</span>
                <span className={styles.phone}>{record.phone || "—"}</span>
                <button type="button" className={styles.editRow} onClick={() => openEdit(record)} aria-label={`Edit ${record.fullName}`}><Pencil size={15} /></button>
              </article>
            ))}
          </div>
        ) : <div className={styles.empty}><Search size={30} /><h2>No clients found</h2><p>Change the filters or add the first matching client.</p><button className="mv-btn mv-btn-primary" onClick={openCreate}>Add client</button></div>}

        <footer className={styles.pagination}><span>Showing {paginated.items.length} of {filtered.length}</span><div><button type="button" disabled={paginated.page <= 1} onClick={() => setQuery("page", String(Math.max(1, paginated.page - 1)))}><ChevronLeft size={17} /> Previous</button><strong>{paginated.page} / {paginated.pageCount}</strong><button type="button" disabled={paginated.page >= paginated.pageCount} onClick={() => setQuery("page", String(paginated.page + 1))}>Next <ChevronRight size={17} /></button></div></footer>
      </section>

      <Dialog.Root open={!!detail} onOpenChange={(open) => !open && setDetailId(null)}>
        <Dialog.Portal><Dialog.Overlay className={styles.overlay} /><Dialog.Content className={styles.drawer}>
          <Dialog.Title className={styles.drawerTitle}>{detail?.fullName ?? "Member dossier"}</Dialog.Title><Dialog.Description className={styles.drawerDescription}>{detail?.progressNote}</Dialog.Description>
          <Dialog.Close className={styles.close} aria-label="Close member details"><X size={18} /></Dialog.Close>
          {detail ? <><div className={styles.dossierHero}><span className={styles.avatar}>{initials(detail.fullName)}</span><div><small>{detail.clientId}</small><strong>{detail.fullName}</strong><p>{detail.email || detail.phone}</p></div></div><div className={styles.statusRow}><span className={tone(detail.status)}>{detail.status}</span><span className={tone(detail.paymentStatus)}>{detail.paymentStatus}</span></div><section className={styles.dossierSection}><h3>Membership</h3><dl><div><dt>Program</dt><dd>{detail.membership}</dd></div><div><dt>Training</dt><dd>{detail.trainingCategory}</dd></div><div><dt>Sport</dt><dd>{detail.sport || "—"}</dd></div><div><dt>Trial outcome</dt><dd>{detail.trialOutcome}</dd></div><div><dt>Group</dt><dd>{detail.primaryGroup}</dd></div><div><dt>Coach</dt><dd>{detail.assignedCoach}</dd></div><div><dt>Payment</dt><dd>{detail.paymentAmountLabel}</dd></div></dl></section><ReceiptHistory receipts={detail.receipts} /><section className={styles.dossierSection}><h3>Injury &amp; restrictions{detail.hasInjuryAlert ? <span className={styles.warning}>⚠ {detail.injuryStatus}</span> : null}</h3><dl><div><dt>Status</dt><dd>{detail.injuryStatus}</dd></div><div><dt>Injury notes</dt><dd>{detail.injuryNotes || "None recorded"}</dd></div><div><dt>Restrictions</dt><dd>{detail.restrictions || "None recorded"}</dd></div></dl></section><section className={styles.dossierSection}><h3>Next sessions</h3>{detail.nextSessions.length ? <ol>{detail.nextSessions.slice(0, 3).map((session) => <li key={session}>{session}</li>)}</ol> : <p>{detail.nextSession}</p>}</section><div className={styles.drawerActions}>{buildWhatsAppHref(detail.phone) ? <a className="mv-btn mv-btn-secondary" href={buildWhatsAppHref(detail.phone) ?? undefined} target="_blank" rel="noreferrer"><MessageCircle size={17} /> Message</a> : null}<button type="button" className="mv-btn mv-btn-primary" onClick={() => { setDetailId(null); openEdit(detail); }}><Pencil size={17} /> Edit member</button></div></> : null}
        </Dialog.Content></Dialog.Portal>
      </Dialog.Root>

      <Dialog.Root open={editorOpen} onOpenChange={setEditorOpen}>
        <Dialog.Portal><Dialog.Overlay className={styles.overlay} /><Dialog.Content className={styles.editor}>
          <Dialog.Title>{editingId ? "Edit member" : "Add a new member"}</Dialog.Title><Dialog.Description>Update the roster record and account state.</Dialog.Description><Dialog.Close className={styles.close} aria-label="Close editor"><X size={18} /></Dialog.Close>
          <form onSubmit={submitClient} className={styles.form}>
            <label className={styles.full}>Full name<input required value={form.fullName} onChange={(event) => setForm((value) => ({ ...value, fullName: event.target.value }))} /></label>
            <label>Email<input type="email" value={form.email} onChange={(event) => setForm((value) => ({ ...value, email: event.target.value }))} /></label>
            <label>Phone<input type="tel" value={form.phone} onChange={(event) => setForm((value) => ({ ...value, phone: event.target.value }))} /></label>
            <label>Status<select value={form.status} onChange={(event) => setForm((value) => ({ ...value, status: event.target.value as ClientForm["status"] }))}>{adminClientStatusFilters.filter((item) => item !== "All").map((item) => <option key={item}>{item}</option>)}</select></label>
            <label>Trial outcome<select value={form.trialOutcome} onChange={(event) => setForm((value) => ({ ...value, trialOutcome: event.target.value as ClientForm["trialOutcome"] }))}>{trialOutcomeLabels.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label>Payment<select value={form.paymentStatus} onChange={(event) => setForm((value) => ({ ...value, paymentStatus: event.target.value as ClientForm["paymentStatus"] }))}>{adminPaymentStatusFilters.filter((item) => item !== "All").map((item) => <option key={item}>{item}</option>)}</select></label>
            <label>Amount<input inputMode="decimal" value={form.paymentAmount} onChange={(event) => setForm((value) => ({ ...value, paymentAmount: event.target.value }))} /></label>
            <label>Group<select value={form.groupId} onChange={(event) => setForm((value) => ({ ...value, groupId: event.target.value }))}><option value="">No group</option>{groupOptions.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}</select></label>
            <label>Training category<select value={form.trainingCategory} onChange={(event) => setForm((value) => ({ ...value, trainingCategory: event.target.value as ClientForm["trainingCategory"] }))}>{trainingCategoryLabels.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label>Sport (optional)<input value={form.sport} onChange={(event) => setForm((value) => ({ ...value, sport: event.target.value }))} placeholder="e.g. Football" /></label>
            <label>Injury status<select value={form.injuryStatus} onChange={(event) => setForm((value) => ({ ...value, injuryStatus: event.target.value as ClientForm["injuryStatus"] }))}>{injuryStatusLabels.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label className={styles.full}>Injury notes<input value={form.injuryNotes} onChange={(event) => setForm((value) => ({ ...value, injuryNotes: event.target.value }))} placeholder="Current or previous injury the coach must know about" /></label>
            <label className={styles.full}>Exercise restrictions<input value={form.restrictions} onChange={(event) => setForm((value) => ({ ...value, restrictions: event.target.value }))} placeholder="Movements or loads to avoid" /></label>
            {error ? <p className={styles.error} role="alert">{error}</p> : null}
            <div className={`${styles.formActions} ${styles.full}`}>{editingId ? <button type="button" className={styles.deleteButton} onClick={() => { setDeleteText(""); setDeleteOpen(true); }}><Trash2 size={16} /> Delete</button> : <span />}<button type="button" className="mv-btn mv-btn-secondary" onClick={() => setEditorOpen(false)}>Cancel</button><button type="submit" className="mv-btn mv-btn-primary" disabled={isPending}>{isPending ? "Saving…" : "Save member"}</button></div>
          </form>
        </Dialog.Content></Dialog.Portal>
      </Dialog.Root>

      <Dialog.Root open={deleteOpen} onOpenChange={setDeleteOpen}><Dialog.Portal><Dialog.Overlay className={styles.overlay} /><Dialog.Content className={styles.confirm}><Dialog.Title>Delete this member?</Dialog.Title><Dialog.Description>This removes the account and connected operational records. Type Delete to continue.</Dialog.Description><label>Confirmation<input value={deleteText} onChange={(event) => setDeleteText(event.target.value)} placeholder="Delete" /></label>{error ? <p className={styles.error} role="alert">{error}</p> : null}<div><button className="mv-btn mv-btn-secondary" onClick={() => setDeleteOpen(false)}>Cancel</button><button className={styles.deleteButton} disabled={deleteText !== "Delete" || isPending} onClick={confirmDelete}>Delete permanently</button></div></Dialog.Content></Dialog.Portal></Dialog.Root>
    </div>
  );
}
