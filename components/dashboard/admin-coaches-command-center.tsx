"use client";

import { useDeferredValue, useEffect, useMemo, useState, useTransition } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CalendarClock,
  Dumbbell,
  Mail,
  Pencil,
  Phone,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Dialog } from "radix-ui";

import { deleteCoach, saveCoach } from "@/app/actions/admin-coaches";
import { IconChip } from "@/components/ui/icon-chip";
import { StatusBadge } from "@/components/ui/status-badge";
import { paginateDashboardItems } from "@/lib/dashboard/pagination";
import type {
  AdminCoachRecord,
  AdminCoachSpecialization,
} from "@/lib/mocks/admin-coaches";
import { getInitials } from "@/lib/utils";

import styles from "./admin-coaches-command-center.module.css";

type CoachFormState = {
  fullName: string;
  email: string;
  phone: string;
  specialization: AdminCoachSpecialization;
};

type CoachSort = "name-asc" | "load-desc" | "availability-desc";

const specializations: Array<"All" | AdminCoachSpecialization> = [
  "All",
  "Strength",
  "Conditioning",
  "Mobility",
  "Private Coaching",
];

const emptyForm: CoachFormState = {
  fullName: "",
  email: "",
  phone: "",
  specialization: "Strength",
};

function getLoadState(coach: AdminCoachRecord) {
  if (coach.sessionsThisWeek === 0) {
    return { label: "Needs schedule", tone: "warning" as const };
  }
  if (coach.activeClients >= 20 || coach.sessionsThisWeek >= 10) {
    return { label: "High load", tone: "critical" as const };
  }
  return { label: "On track", tone: "success" as const };
}

function CoachLoadBars({ coach }: { coach: AdminCoachRecord }) {
  const max = Math.max(1, ...coach.weeklyLoad.map((day) => day.sessions));

  return (
    <div className={styles.loadChart} aria-label={`${coach.fullName} weekly sessions`}>
      {coach.weeklyLoad.map((day) => (
        <div key={day.day} className={styles.loadDay}>
          <span
            style={{ height: `${Math.max(10, (day.sessions / max) * 100)}%` }}
            aria-hidden="true"
          />
          <small>{day.day.slice(0, 1)}</small>
          <em className="sr-only">{day.sessions} sessions</em>
        </div>
      ))}
    </div>
  );
}

export function AdminCoachesCommandCenter({ records }: { records: AdminCoachRecord[] }) {
  const router = useRouter();
  const [isSaving, startSave] = useTransition();
  const [isDeleting, startDelete] = useTransition();
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [specialization, setSpecialization] = useState<"All" | AdminCoachSpecialization>("All");
  const [sort, setSort] = useState<CoachSort>("name-asc");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState(records[0]?.id ?? "");
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CoachFormState>(emptyForm);
  const [error, setError] = useState("");
  const [deleteMode, setDeleteMode] = useState(false);
  const [confirmation, setConfirmation] = useState("");

  const visibleRecords = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase();
    const filtered = records.filter((coach) => {
      const matchesQuery = !query || [coach.fullName, coach.email, coach.specialization, coach.summary]
        .join(" ").toLowerCase().includes(query);
      return matchesQuery && (specialization === "All" || coach.specialization === specialization);
    });

    return filtered.sort((left, right) => {
      if (sort === "load-desc") {
        return right.sessionsThisWeek + right.activeClients - left.sessionsThisWeek - left.activeClients;
      }
      if (sort === "availability-desc") {
        return right.openSlots - left.openSlots;
      }
      return left.fullName.localeCompare(right.fullName);
    });
  }, [deferredSearch, records, sort, specialization]);

  useEffect(() => setPage(1), [deferredSearch, specialization, sort]);

  const paginated = paginateDashboardItems(visibleRecords, page);
  const selected = visibleRecords.find((coach) => coach.id === selectedId) ?? visibleRecords[0];
  const sessionsThisWeek = visibleRecords.reduce((sum, coach) => sum + coach.sessionsThisWeek, 0);
  const activeClients = visibleRecords.reduce((sum, coach) => sum + coach.activeClients, 0);
  const coverageGaps = visibleRecords.filter((coach) => coach.sessionsThisWeek === 0 || coach.conflicts > 0).length;

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setDeleteMode(false);
    setConfirmation("");
    setIsEditorOpen(true);
  }

  function openEdit(coach: AdminCoachRecord) {
    setEditingId(coach.id);
    setForm({
      fullName: coach.fullName,
      email: coach.email,
      phone: coach.phone,
      specialization: coach.specialization,
    });
    setError("");
    setDeleteMode(false);
    setConfirmation("");
    setIsEditorOpen(true);
  }

  function handleSave() {
    setError("");
    startSave(async () => {
      try {
        await saveCoach({ coachId: editingId, ...form });
        setIsEditorOpen(false);
        router.refresh();
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Could not save coach.");
      }
    });
  }

  function handleDelete() {
    if (!editingId) return;
    setError("");
    startDelete(async () => {
      try {
        await deleteCoach({ coachId: editingId, confirmationText: confirmation });
        setIsEditorOpen(false);
        router.refresh();
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Could not delete coach.");
      }
    });
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}><ShieldCheck size={15} /> Coaching operations</span>
          <h1>Coach Command Center</h1>
          <p>Balance expertise, client load, and weekly coverage from one focused workspace.</p>
        </div>
        <button type="button" className="mv-btn mv-btn-primary" onClick={openCreate}>
          <Plus size={16} /> Add coach
        </button>
      </header>

      <section className={styles.insights} aria-label="Coach coverage summary">
        <article className={styles.insightPrimary}>
          <IconChip icon={Users} tone="brand" />
          <div><span>Active coaches</span><strong>{visibleRecords.length}</strong></div>
          <p>{activeClients} clients currently covered</p>
        </article>
        <article>
          <IconChip icon={Dumbbell} tone="success" />
          <div><span>Weekly delivery</span><strong>{sessionsThisWeek}</strong></div>
          <p>Sessions assigned across the team</p>
        </article>
        <article>
          <IconChip icon={AlertTriangle} tone={coverageGaps ? "warning" : "success"} />
          <div><span>Coverage gaps</span><strong>{coverageGaps}</strong></div>
          <p>{coverageGaps ? "Needs scheduling attention" : "The roster is balanced"}</p>
        </article>
      </section>

      <section className={styles.controls} aria-label="Filter coaches">
        <label className={styles.searchField}>
          <span className="sr-only">Search coaches</span>
          <Search size={17} aria-hidden="true" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search coach, expertise, or note"
          />
        </label>
        <div className={styles.specializations} aria-label="Specialization">
          {specializations.map((option) => (
            <button
              type="button"
              key={option}
              className={option === specialization ? styles.filterActive : undefined}
              onClick={() => setSpecialization(option)}
            >
              {option}
            </button>
          ))}
        </div>
        <label className={styles.sortField}>
          <span>Sort</span>
          <select value={sort} onChange={(event) => setSort(event.target.value as CoachSort)}>
            <option value="name-asc">Name A–Z</option>
            <option value="load-desc">Highest load</option>
            <option value="availability-desc">Most availability</option>
          </select>
        </label>
      </section>

      {visibleRecords.length ? (
        <div className={styles.workspace}>
          <section className={styles.roster} aria-label="Coach roster">
            <div className={styles.sectionHeading}>
              <div><span>Team roster</span><h2>{visibleRecords.length} coaches in view</h2></div>
              <small>Choose a coach to focus</small>
            </div>
            <div className={styles.cardGrid}>
              {paginated.items.map((coach) => {
                const state = getLoadState(coach);
                const isSelected = coach.id === selected?.id;
                return (
                  <article
                    key={coach.id}
                    className={`${styles.coachCard} ${isSelected ? styles.coachCardSelected : ""}`}
                  >
                    <button type="button" className={styles.cardSelect} onClick={() => setSelectedId(coach.id)}>
                      <span className={styles.avatar}>{getInitials(coach.fullName)}</span>
                      <span className={styles.coachIdentity}>
                        <small>{coach.specialization}</small>
                        <strong>{coach.fullName}</strong>
                        <em>{coach.summary}</em>
                      </span>
                      <StatusBadge tone={state.tone}>{state.label}</StatusBadge>
                    </button>
                    <div className={styles.cardMetrics}>
                      <span><strong>{coach.activeClients}</strong> clients</span>
                      <span><strong>{coach.sessionsThisWeek}</strong> sessions</span>
                      <span><strong>{coach.openSlots}</strong> open</span>
                    </div>
                    <CoachLoadBars coach={coach} />
                    <div className={styles.cardFooter}>
                      <button type="button" onClick={() => setSelectedId(coach.id)}>Focus coach</button>
                      <button type="button" onClick={() => openEdit(coach)}><Pencil size={14} /> Edit</button>
                    </div>
                  </article>
                );
              })}
            </div>
            <div className={styles.pagination}>
              <span>{paginated.startItem}–{paginated.endItem} of {paginated.totalItems}</span>
              <div>
                <button type="button" onClick={() => setPage(page - 1)} disabled={page <= 1} aria-label="Previous page"><ArrowLeft size={16} /></button>
                <span>{paginated.page} / {paginated.pageCount}</span>
                <button type="button" onClick={() => setPage(page + 1)} disabled={page >= paginated.pageCount} aria-label="Next page"><ArrowRight size={16} /></button>
              </div>
            </div>
          </section>

          <aside className={styles.focusPanel} aria-label="Focused coach">
            {selected ? (
              <>
                <div className={styles.focusHero}>
                  <span className={styles.focusAvatar}>{getInitials(selected.fullName)}</span>
                  <div><small>{selected.specialization}</small><h2>{selected.fullName}</h2><p>{selected.summary}</p></div>
                  <button type="button" onClick={() => openEdit(selected)} aria-label={`Edit ${selected.fullName}`}><Pencil size={16} /></button>
                </div>
                <div className={styles.contactList}>
                  <span><Mail size={15} /> {selected.email}</span>
                  <span><Phone size={15} /> {selected.phone}</span>
                </div>
                <div className={styles.focusStats}>
                  <article><span>Clients</span><strong>{selected.activeClients}</strong></article>
                  <article><span>Sessions</span><strong>{selected.sessionsThisWeek}</strong></article>
                  <article><span>Open slots</span><strong>{selected.openSlots}</strong></article>
                  <article><span>Conflicts</span><strong>{selected.conflicts}</strong></article>
                </div>
                <section className={styles.weekPlan}>
                  <div><IconChip icon={CalendarClock} tone="success" /><span><strong>Weekly rhythm</strong><small>Assigned sessions by day</small></span></div>
                  <CoachLoadBars coach={selected} />
                  <ol>
                    {selected.weeklyLoad.map((day) => <li key={day.day}><span>{day.day}</span><strong>{day.sessions}</strong></li>)}
                  </ol>
                </section>
                <div className={styles.focusStatus}>
                  <StatusBadge tone={getLoadState(selected).tone}>{getLoadState(selected).label}</StatusBadge>
                  <p>{selected.conflicts ? `${selected.conflicts} schedule conflicts require review.` : "No schedule conflicts recorded."}</p>
                </div>
              </>
            ) : null}
          </aside>
        </div>
      ) : (
        <section className={styles.empty}>
          <Search size={22} />
          <h2>No coaches match this view</h2>
          <p>Clear the search or choose another specialization.</p>
          <button type="button" className="mv-btn mv-btn-secondary" onClick={() => { setSearch(""); setSpecialization("All"); }}>Reset filters</button>
        </section>
      )}

      <Dialog.Root open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className={styles.dialogOverlay} />
          <Dialog.Content className={styles.editor}>
            <header className={styles.editorHeader}>
              <div><Dialog.Title>{editingId ? "Edit coach" : "Add a coach"}</Dialog.Title><Dialog.Description>Identity, contact, and coaching expertise.</Dialog.Description></div>
              <Dialog.Close asChild><button type="button" aria-label="Close coach editor"><X size={19} /></button></Dialog.Close>
            </header>
            <div className={styles.editorBody}>
              {error ? <div className={styles.error} role="alert"><AlertTriangle size={17} /><span>{error}</span></div> : null}
              <label><span>Full name</span><input value={form.fullName} onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))} /></label>
              <label><span>Email</span><input type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} /></label>
              <label><span>Phone</span><input value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} /></label>
              <label><span>Specialization</span><select value={form.specialization} onChange={(event) => setForm((current) => ({ ...current, specialization: event.target.value as AdminCoachSpecialization }))}>{specializations.filter((item) => item !== "All").map((item) => <option key={item}>{item}</option>)}</select></label>
              {editingId ? (
                <section className={styles.dangerZone}>
                  {!deleteMode ? <button type="button" onClick={() => setDeleteMode(true)}><Trash2 size={16} /> Delete coach</button> : <><div><strong>Confirm deletion</strong><p>Type Delete to permanently remove this coach.</p></div><input value={confirmation} onChange={(event) => setConfirmation(event.target.value)} placeholder="Type Delete" /><button type="button" disabled={confirmation.trim() !== "Delete" || isDeleting} onClick={handleDelete}>{isDeleting ? "Deleting…" : "Delete permanently"}</button></>}
                </section>
              ) : null}
            </div>
            <footer className={styles.editorFooter}>
              <Dialog.Close asChild><button type="button" className="mv-btn mv-btn-secondary">Cancel</button></Dialog.Close>
              <button type="button" className="mv-btn mv-btn-primary" onClick={handleSave} disabled={isSaving || isDeleting}>{isSaving ? "Saving…" : editingId ? "Save changes" : "Create coach"}</button>
            </footer>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
