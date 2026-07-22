"use client";

import { Ban, CircleCheck, Mail, Phone, Search, Trash2, UserRoundX, X } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "radix-ui";

import { deleteLead } from "@/app/actions/admin-leads";
import type {
  InactiveLeadOutcome,
  InactiveLeadRecord,
} from "@/lib/dashboard/admin-dashboard-data";
import { normalizeLeadSource } from "@/lib/dashboard/lead-source";
import { formatPhoneNumber } from "@/lib/phone-format";
import { EntityDialog } from "@/components/ui/entity-form";
import { useDashboardToast } from "./dashboard-toast-provider";
import styles from "./admin-inactive-leads-workspace.module.css";

type OutcomeFilter = "All" | InactiveLeadOutcome;

const outcomeFilters: OutcomeFilter[] = ["All", "Lost", "Converted"];

function initials(name: string) {
  return name.split(" ").map((part) => part[0]).filter(Boolean).join("").slice(0, 2).toUpperCase();
}

export function AdminInactiveLeadsWorkspace({
  records,
  totalCount,
  lostCount,
  convertedCount,
}: {
  records: InactiveLeadRecord[];
  totalCount: number;
  lostCount: number;
  convertedCount: number;
}) {
  const router = useRouter();
  const { showToast } = useDashboardToast();
  const [outcome, setOutcome] = useState<OutcomeFilter>("All");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<InactiveLeadRecord | null>(null);
  const [deleting, setDeleting] = useState<InactiveLeadRecord | null>(null);
  const [pending, startTransition] = useTransition();

  const conversionRate = totalCount ? Math.round((convertedCount / totalCount) * 100) : 0;

  const term = search.trim().toLowerCase();
  const shown = useMemo(() => {
    return records.filter((lead) => {
      const matchesOutcome = outcome === "All" || lead.outcome === outcome;
      const matchesSearch =
        !term ||
        [lead.fullName, lead.email, lead.phone, lead.source, lead.lostReason]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(term);
      return matchesOutcome && matchesSearch;
    });
  }, [records, outcome, term]);

  function removeLead() {
    if (!deleting) return;
    const target = deleting;
    startTransition(async () => {
      try {
        await deleteLead(target.id);
        showToast(`${target.fullName} was removed from the archive.`);
        setDeleting(null);
        if (selected?.id === target.id) setSelected(null);
        router.refresh();
      } catch (caught) {
        showToast(caught instanceof Error ? caught.message : "The lead could not be deleted.", "warning");
      }
    });
  }

  const countFor = (value: OutcomeFilter) =>
    value === "All" ? totalCount : records.filter((lead) => lead.outcome === value).length;

  return (
    <div className={styles.wrap} aria-busy={pending}>
      <section className={styles.stats}>
        <article>
          <span><UserRoundX size={15} /> Inactive leads</span>
          <strong>{totalCount}</strong>
          <small>Out of the active pipeline</small>
        </article>
        <article data-tone="lost">
          <span><Ban size={15} /> Marked lost</span>
          <strong>{lostCount}</strong>
          <small>Closed without converting</small>
        </article>
        <article data-tone="converted">
          <span><CircleCheck size={15} /> Converted</span>
          <strong>{convertedCount}</strong>
          <small>Became paying clients</small>
        </article>
        <article data-tone="rate">
          <span>Conversion share</span>
          <strong>{conversionRate}<em>%</em></strong>
          <i><b style={{ width: `${conversionRate}%` }} /></i>
        </article>
      </section>

      <div className={styles.topRow}>
        <label className={styles.search}>
          <span className={styles.searchIcon}><Search size={14} /></span>
          <span className="sr-only">Search inactive leads</span>
          <input className={styles.searchInput} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name, phone, email, or reason" />
        </label>
        <div className={styles.filters}>
          {outcomeFilters.map((value) => (
            <button key={value} type="button" data-active={outcome === value || undefined} data-outcome={value} onClick={() => setOutcome(value)}>
              {value}<b>{countFor(value)}</b>
            </button>
          ))}
        </div>
      </div>

      <div className={styles.tableScroll}>
        <div className={styles.table}>
          <div className={styles.head}>
            <span />
            <span className={styles.colLabel}>Lead</span>
            <span className={styles.colLabel}>Source</span>
            <span className={styles.colLabel}>Interest</span>
            <span className={styles.colLabel}>Outcome</span>
            <span className={styles.colLabel}>Reason / note</span>
            <span className={styles.colLabel}>Closed</span>
            <span />
          </div>

          {shown.length === 0 ? (
            <div className={styles.empty}>
              <UserRoundX size={30} />
              <h2>{totalCount ? "No leads match these filters" : "No inactive leads yet"}</h2>
              <p>{totalCount ? "Try a different outcome or clear the search." : "Leads marked lost or converted from the pipeline will appear here."}</p>
            </div>
          ) : null}

          {shown.map((lead) => (
            <div key={lead.id} className={styles.row} data-outcome={lead.outcome}>
              <span className={styles.accent} data-outcome={lead.outcome} />
              <button type="button" className={styles.leadCell} onClick={() => setSelected(lead)}>
                <span className={styles.avatar} data-outcome={lead.outcome}>{initials(lead.fullName)}</span>
                <span className={styles.minCol}>
                  <span className={styles.name}>{lead.fullName}</span>
                  <span className={styles.note}>{lead.email ?? "No email"}</span>
                </span>
              </button>
              <div className={styles.pad}>
                <span className={styles.sourcePill} data-source={normalizeLeadSource(lead.source)}>{normalizeLeadSource(lead.source)}</span>
              </div>
              <div className={styles.pad}><span className={styles.muted}>{lead.interestedCategory ?? "—"}</span></div>
              <div className={styles.pad}>
                <span className={styles.outcomePill} data-outcome={lead.outcome}>
                  {lead.outcome === "Converted" ? <CircleCheck size={12} /> : <Ban size={12} />}
                  {lead.outcome}
                </span>
              </div>
              <div className={styles.pad}>
                <span className={styles.reason}>{lead.outcome === "Lost" ? (lead.lostReason?.trim() || "No reason recorded") : lead.message}</span>
              </div>
              <div className={styles.pad}><span className={styles.date}>{lead.createdAtLabel}</span></div>
              <div className={styles.rowTools}>
                <button type="button" className={styles.delBtn} aria-label={`Delete ${lead.fullName}`} title={`Delete ${lead.fullName}`} disabled={pending} onClick={() => setDeleting(lead)}>
                  <X size={14} aria-hidden="true" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selected ? <LeadDrawer lead={selected} close={() => setSelected(null)} onDelete={() => setDeleting(selected)} /> : null}
      {deleting ? (
        <EntityDialog open onOpenChange={(open) => !open && !pending && setDeleting(null)} title={`Delete ${deleting.fullName}?`} description="This permanently removes the lead record from the archive. This cannot be undone." closeLabel="Close delete confirmation" size="small">
          <div className={styles.deleteActions}>
            <button type="button" className="mv-btn mv-btn-secondary" onClick={() => setDeleting(null)} disabled={pending}>Cancel</button>
            <button type="button" className="mv-btn mv-btn-primary" onClick={removeLead} disabled={pending}>{pending ? "Deleting…" : "Delete lead"}<Trash2 size={14} /></button>
          </div>
        </EntityDialog>
      ) : null}
    </div>
  );
}

function LeadDrawer({ lead, close, onDelete }: { lead: InactiveLeadRecord; close: () => void; onDelete: () => void }) {
  return (
    <Dialog.Root open onOpenChange={(open) => !open && close()}>
      <Dialog.Portal>
        <Dialog.Overlay className={styles.drawerOverlay} />
        <Dialog.Content className={styles.drawer} aria-describedby={undefined}>
          <header className={styles.drawerHeader}>
            <Dialog.Close className={styles.close} aria-label="Close"><X size={18} /></Dialog.Close>
            <div className={styles.identity}>
              <i data-outcome={lead.outcome}>{initials(lead.fullName)}</i>
              <div>
                <Dialog.Title asChild><h2>{lead.fullName}</h2></Dialog.Title>
                <p><span data-outcome={lead.outcome}>{lead.outcome}</span>{normalizeLeadSource(lead.source)} · Closed {lead.createdAtLabel}</p>
              </div>
            </div>
            <div className={styles.quickActions}>
              <a href={`tel:${lead.phone}`}><Phone size={14} /> Call</a>
              {lead.email ? <a href={`mailto:${lead.email}`}><Mail size={14} /> Email</a> : null}
            </div>
          </header>

          <dl className={styles.details}>
            <div><dt>Phone</dt><dd>{formatPhoneNumber(lead.phone)}</dd></div>
            <div><dt>Email</dt><dd>{lead.email ?? "No email"}</dd></div>
            <div><dt>Interest</dt><dd>{lead.interestedCategory ?? "Not specified"}</dd></div>
            {lead.preferredAvailability ? <div><dt>Availability</dt><dd>{lead.preferredAvailability}</dd></div> : null}
            {lead.outcome === "Lost" ? <div><dt>Lost reason</dt><dd>{lead.lostReason?.trim() || "No reason recorded"}</dd></div> : null}
            <div><dt>Note</dt><dd>{lead.message}</dd></div>
          </dl>

          <footer className={styles.drawerFooter}>
            <button type="button" className={styles.danger} onClick={onDelete}><Trash2 size={14} /> Delete permanently</button>
          </footer>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
