"use client";

import { useMemo, useState, useTransition, type FormEvent, type MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, MessageCircle, Pencil, Plus, Trash2, UsersRound } from "lucide-react";

import { issueAccountPasswordResetLink } from "@/app/actions/account-security";
import { deleteCoach, saveCoach } from "@/app/actions/admin-coaches";
import type { AdminCoachRecord, AdminCoachSpecialization } from "@/lib/dashboard/admin-coach-record";
import type { TrainingCategoryOption } from "@/lib/dashboard/training-category";
import { getInitials } from "@/lib/utils";
import { buildWhatsAppHref } from "@/lib/whatsapp";
import {
  ConfirmDeleteDialog,
  EntityDialog,
  EntityForm,
  FormActions,
  FormErrorBanner,
  FormField,
} from "@/components/ui/entity-form";
import { TemporaryCredentialsDialog, type TemporaryCredentials } from "./temporary-credentials-dialog";
import { PasswordResetLinkDialog, type PasswordResetLink } from "./password-reset-link-dialog";
import { useDashboardToast } from "./dashboard-toast-provider";
import styles from "./admin-coaches-command-center.module.css";

type CoachForm = {
  fullName: string;
  email: string;
  phone: string;
  specialization: AdminCoachSpecialization;
  qualifiedCategoryIds: string[];
};

const emptyForm: CoachForm = {
  fullName: "",
  email: "",
  phone: "",
  specialization: "Strength",
  qualifiedCategoryIds: [],
};

const AVATAR_TONES = [
  "linear-gradient(135deg,#e62429,#ff656a)",
  "linear-gradient(135deg,#3b82f6,#8b5cf6)",
  "linear-gradient(135deg,#8b5cf6,#ec4899)",
  "linear-gradient(135deg,#f59e0b,#ff6b35)",
  "linear-gradient(135deg,#25d366,#14b8a6)",
  "linear-gradient(135deg,#06b6d4,#3b82f6)",
];

function avatarTone(id: string) {
  let hash = 0;
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return AVATAR_TONES[hash % AVATAR_TONES.length];
}

export function AdminCoachesCommandCenter({
  records,
  categoryOptions,
}: {
  records: AdminCoachRecord[];
  categoryOptions: TrainingCategoryOption[];
}) {
  const router = useRouter();
  const { showToast } = useDashboardToast();
  const [pending, startTransition] = useTransition();
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [form, setForm] = useState<CoachForm>(emptyForm);
  const [error, setError] = useState("");
  const [credentials, setCredentials] = useState<TemporaryCredentials | null>(null);
  const [resetLink, setResetLink] = useState<PasswordResetLink | null>(null);

  const visible = useMemo(
    () => [...records]
      .filter((coach) => categoryFilter === "All" || coach.qualifiedCategories.some((category) => category.id === categoryFilter))
      .sort((a, b) => a.fullName.localeCompare(b.fullName)),
    [categoryFilter, records],
  );

  function openCreate() {
    const firstCategory = categoryOptions.find((category) => category.isActive);
    setEditingId(null);
    setForm({ ...emptyForm, qualifiedCategoryIds: firstCategory ? [firstCategory.id] : [] });
    setDeleteOpen(false);
    setConfirmation("");
    setError("");
    setEditorOpen(true);
  }

  function openEdit(coach: AdminCoachRecord) {
    setEditingId(coach.id);
    setForm({
      fullName: coach.fullName,
      email: coach.email,
      phone: coach.phone,
      specialization: coach.specialization,
      qualifiedCategoryIds: coach.qualifiedCategories.map((category) => category.id),
    });
    setDeleteOpen(false);
    setConfirmation("");
    setError("");
    setEditorOpen(true);
  }

  function openDelete(coach: AdminCoachRecord) {
    openEdit(coach);
    setEditorOpen(false);
    setDeleteOpen(true);
  }

  function stopAndEdit(event: MouseEvent, coach: AdminCoachRecord) {
    event.stopPropagation();
    openEdit(coach);
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    startTransition(async () => {
      try {
        const result = await saveCoach({ coachId: editingId, ...form });
        setEditorOpen(false);
        if (result.credentials) setCredentials({ accountType: "coach", ...result.credentials });
        showToast(editingId ? "Coach updated." : "Coach added.");
        router.refresh();
      } catch (caught) {
        const description = caught instanceof Error ? caught.message : "Could not save coach.";
        setError(description);
        showToast(description, "warning");
      }
    });
  }

  function removeCoach() {
    if (!editingId) return;
    setError("");
    startTransition(async () => {
      try {
        await deleteCoach({ coachId: editingId, confirmationText: confirmation });
        setDeleteOpen(false);
        showToast("Coach deleted.");
        router.refresh();
      } catch (caught) {
        const description = caught instanceof Error ? caught.message : "Could not delete coach.";
        setError(description);
        showToast(description, "warning");
      }
    });
  }

  function issueResetLink() {
    if (!editingId) return;
    setError("");
    startTransition(async () => {
      try {
        const result = await issueAccountPasswordResetLink({ profileId: editingId, profileType: "coach" });
        setEditorOpen(false);
        setResetLink({
          accountName: form.fullName,
          accountType: "coach",
          expiresAt: result.expiresAt,
          url: new URL(result.path, window.location.origin).toString(),
        });
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Could not issue a reset link.");
      }
    });
  }

  function toggleCategory(categoryId: string) {
    setForm((value) => ({
      ...value,
      qualifiedCategoryIds: value.qualifiedCategoryIds.includes(categoryId)
        ? value.qualifiedCategoryIds.filter((id) => id !== categoryId)
        : [...value.qualifiedCategoryIds, categoryId],
    }));
  }

  return (
    <div className={styles.page} aria-busy={pending}>
      <div className={styles.board}>
        <header className={styles.header}>
          <div className={styles.filters}>
            <label>
              Qualified category
              <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
                <option value="All">All categories</option>
                {categoryOptions.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
            </label>
          </div>
          <div className={styles.headerActions}>
            <button type="button" className={styles.newBtn} onClick={openCreate}><Plus size={16} /> New coach</button>
          </div>
        </header>

        {visible.length ? (
          <div className={styles.coachGrid}>
            {visible.map((coach) => {
              const whatsappHref = buildWhatsAppHref(coach.phone);
              return (
                <article className={styles.coachCard} key={coach.id} onClick={() => openEdit(coach)}>
                  <div className={styles.cardHeader}>
                    <span className={styles.avatar} style={{ background: avatarTone(coach.id) }}>{getInitials(coach.fullName)}</span>
                    <div className={styles.meta}>
                      <h2 className={styles.coachName}>{coach.fullName}</h2>
                      <span className={styles.specialty}>{coach.qualifiedCategories.map((category) => category.name).join(" · ") || "No categories"}</span>
                    </div>
                    <span className={`${styles.badge} ${coach.activeGroups ? styles.badgeFree : styles.badgeOff}`}>
                      {coach.activeGroups ? `${coach.activeGroups} active` : "Unassigned"}
                    </span>
                    <div className={styles.cardActions}>
                      {whatsappHref ? <a className={styles.editBtn} href={whatsappHref} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()} aria-label={`Message ${coach.fullName}`}><MessageCircle size={13} /></a> : null}
                      <button type="button" className={styles.editBtn} onClick={(event) => stopAndEdit(event, coach)} aria-label={`Edit ${coach.fullName}`}><Pencil size={13} /></button>
                      <button type="button" className={styles.deleteBtn} onClick={(event) => { event.stopPropagation(); openDelete(coach); }} aria-label={`Delete ${coach.fullName}`}><Trash2 size={13} /></button>
                    </div>
                  </div>

                  <div className={styles.activityLine}>{coach.summary}</div>
                  <div className={styles.timeline} aria-label="Sessions scheduled this week">
                    {coach.weeklyLoad.map((day) => <div key={day.day} className={styles.slotItem} data-active={day.sessions > 0 || undefined}><span className={styles.slotLabel}>{day.day.slice(0, 1)}</span><span className={styles.slotLabel}>{day.sessions}</span></div>)}
                  </div>
                  <div className={styles.metricsList}>
                    <div className={styles.metricRow}><span className={styles.metricLabel}>Sessions today</span><span className={styles.metricVal}>{coach.sessionsToday}</span></div>
                    <div className={styles.metricRow}><span className={styles.metricLabel}>{coach.sessionsThisWeek === 1 ? "Session/wk" : "Sessions/wk"}</span><span className={styles.metricVal}>{coach.sessionsThisWeek}</span></div>
                    <div className={styles.metricRow}><span className={styles.metricLabel}>Assigned groups</span><span className={styles.metricVal}>{coach.assignedGroups.length}</span></div>
                    <div className={styles.metricRow}><span className={styles.metricLabel}>{coach.activeClients === 1 ? "Client" : "Clients"}</span><span className={styles.metricVal}>{coach.activeClients}</span></div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : <div className={styles.empty}><UsersRound size={30} /><h2>No coaches found</h2><p>Change the category filter or add a coach.</p></div>}
      </div>

      <EntityDialog open={editorOpen} onOpenChange={setEditorOpen} title={editingId ? "Manage coach" : "Add a coach"} description="Maintain the coach account and qualified training categories." closeLabel="Close coach editor">
        <EntityForm onSubmit={submit}>
          <FormField label="Full name" required full><input required value={form.fullName} onChange={(event) => setForm((value) => ({ ...value, fullName: event.target.value }))} /></FormField>
          <FormField label="Email" required><input required type="email" value={form.email} onChange={(event) => setForm((value) => ({ ...value, email: event.target.value }))} /></FormField>
          <FormField label="Phone"><input type="tel" placeholder="+20 100 000 0000" value={form.phone} onChange={(event) => setForm((value) => ({ ...value, phone: event.target.value }))} /></FormField>
          <FormField label="Qualified categories" full>
            <div className={styles.categoryGrid}>
              {categoryOptions.filter((category) => category.isActive || form.qualifiedCategoryIds.includes(category.id)).map((category) => (
                <label className={styles.categoryOption} key={category.id}>
                  <input type="checkbox" checked={form.qualifiedCategoryIds.includes(category.id)} onChange={() => toggleCategory(category.id)} />
                  <span>{category.name}{category.isActive ? "" : " (archived)"}</span>
                </label>
              ))}
            </div>
          </FormField>
          {editingId ? <button type="button" className={`mv-btn mv-btn-secondary ${styles.full}`} onClick={issueResetLink} disabled={pending}><KeyRound size={16} /> Reset access</button> : null}
          {error ? <FormErrorBanner>{error}</FormErrorBanner> : null}
          <FormActions onCancel={() => setEditorOpen(false)} onDelete={editingId ? () => { setConfirmation(""); setDeleteOpen(true); } : undefined} submitLabel="Save coach" pendingLabel="Saving…" pending={pending} />
        </EntityForm>
      </EntityDialog>

      <ConfirmDeleteDialog open={deleteOpen} onOpenChange={setDeleteOpen} title="Delete this coach?" description="Assigned groups or sessions must be moved first. Type Delete to confirm." confirmationValue={confirmation} onConfirmationChange={setConfirmation} error={error} pending={pending} onConfirm={removeCoach} closeLabel="Close delete confirmation" />
      <TemporaryCredentialsDialog credentials={credentials} onClose={() => setCredentials(null)} />
      <PasswordResetLinkDialog resetLink={resetLink} onClose={() => setResetLink(null)} />
    </div>
  );
}
