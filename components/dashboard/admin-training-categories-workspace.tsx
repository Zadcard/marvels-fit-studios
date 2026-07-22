"use client";

import { useMemo, useState, useTransition, type FormEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Archive, ChevronRight, FolderTree, Pencil, Plus, ShieldUser, Trash2 } from "lucide-react";

import {
  deleteTrainingCategory,
  saveTrainingCategory,
  setTrainingCategoryActive,
  setTrainingCategorySupervisors,
} from "@/app/actions/admin-training-categories";
import type {
  AdminGroupCategoryOption,
  AdminGroupClientOption,
  AdminGroupCoachOption,
  AdminGroupRecord,
} from "@/lib/dashboard/admin-group-record";
import type { AdminTrainingCategoryRecord } from "@/lib/dashboard/training-category";
import { AdminGroupsWorkspace } from "./admin-groups-workspace";
import { useDashboardToast } from "./dashboard-toast-provider";
import { ConfirmDeleteDialog, EntityDialog, EntityForm, FormActions, FormErrorBanner, FormField } from "@/components/ui/entity-form";
import styles from "./admin-training-categories-workspace.module.css";

type Props = {
  records: AdminTrainingCategoryRecord[];
  groupRecords: AdminGroupRecord[];
  coachOptions: AdminGroupCoachOption[];
  clientOptions: AdminGroupClientOption[];
  categoryOptions: AdminGroupCategoryOption[];
  mode?: "admin" | "supervisor";
};

export function AdminTrainingCategoriesWorkspace({
  records,
  groupRecords,
  coachOptions,
  clientOptions,
  categoryOptions,
  mode = "admin",
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { showToast } = useDashboardToast();
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<"All" | "Active" | "Archived">("All");
  const [editing, setEditing] = useState<AdminTrainingCategoryRecord | null | "new">(null);
  const [name, setName] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [deleting, setDeleting] = useState<AdminTrainingCategoryRecord | null>(null);
  const [confirmation, setConfirmation] = useState("");
  const [supervisorCategory, setSupervisorCategory] = useState<AdminTrainingCategoryRecord | null>(null);
  const [supervisorIds, setSupervisorIds] = useState<string[]>([]);
  const [error, setError] = useState("");

  const visible = useMemo(
    () => records.filter((record) => status === "All" || (status === "Active" ? record.isActive : !record.isActive)),
    [records, status],
  );
  const requestedCategoryId = searchParams.get("category");
  const selected = visible.find((record) => record.id === requestedCategoryId)
    ?? records.find((record) => record.id === requestedCategoryId)
    ?? visible[0]
    ?? records[0]
    ?? null;

  function selectCategory(categoryId: string) {
    const next = new URLSearchParams(searchParams.toString());
    next.set("category", categoryId);
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  }

  function openCreate() {
    setEditing("new");
    setName("");
    setIsActive(true);
    setError("");
  }

  function openEdit(record: AdminTrainingCategoryRecord) {
    setEditing(record);
    setName(record.name);
    setIsActive(record.isActive);
    setError("");
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    startTransition(async () => {
      try {
        const result = await saveTrainingCategory({ categoryId: editing === "new" ? null : editing?.id, name, isActive });
        setEditing(null);
        showToast(editing === "new" ? "Program created." : "Program updated.");
        if (editing === "new" && result?.id) selectCategory(result.id);
        router.refresh();
      } catch (caught) {
        const message = caught instanceof Error ? caught.message : "Could not save the category.";
        setError(message);
        showToast(message, "warning");
      }
    });
  }

  function toggleActive(record: AdminTrainingCategoryRecord) {
    startTransition(async () => {
      try {
        await setTrainingCategoryActive(record.id, !record.isActive);
        showToast(record.isActive ? "Program archived." : "Program activated.");
        router.refresh();
      } catch (caught) {
        showToast(caught instanceof Error ? caught.message : "Could not update the category.", "warning");
      }
    });
  }

  function confirmDelete() {
    if (!deleting) return;
    setError("");
    startTransition(async () => {
      try {
        await deleteTrainingCategory({ categoryId: deleting.id, confirmationText: confirmation });
        setDeleting(null);
        setConfirmation("");
        showToast("Program deleted.");
        router.refresh();
      } catch (caught) {
        const message = caught instanceof Error ? caught.message : "Could not delete the category.";
        setError(message);
        showToast(message, "warning");
      }
    });
  }

  function openSupervisors(record: AdminTrainingCategoryRecord) {
    setSupervisorCategory(record);
    setSupervisorIds(record.supervisors.map((supervisor) => supervisor.id));
    setError("");
  }

  function saveSupervisors() {
    if (!supervisorCategory) return;
    startTransition(async () => {
      try {
        await setTrainingCategorySupervisors(supervisorCategory.id, supervisorIds);
        setSupervisorCategory(null);
        showToast("Program supervisors updated.");
        router.refresh();
      } catch (caught) {
        const message = caught instanceof Error ? caught.message : "Could not update supervisors.";
        setError(message);
        showToast(message, "warning");
      }
    });
  }

  const selectedGroups = selected ? groupRecords.filter((group) => group.categoryId === selected.id) : [];
  const selectedCategoryOptions = selected ? categoryOptions.filter((category) => category.id === selected.id) : [];

  return <div className={styles.page} aria-busy={pending}>
    <header className={styles.header}>
      <div><span>Studio structure</span><h1>Programs</h1><p>Choose a program to manage its groups, coaches, members, and recurring sessions.</p></div>
      {mode === "admin" ? <button type="button" className="mv-btn mv-btn-primary" onClick={openCreate}><Plus size={16} /> New program</button> : null}
    </header>

    <div className={styles.filters}>
      {(["All", "Active", "Archived"] as const).map((item) => <button type="button" key={item} data-active={status === item || undefined} onClick={() => setStatus(item)}>{item}</button>)}
    </div>

    {visible.length ? <div className={styles.hub}>
      <aside className={styles.categoryRail} aria-label="Training programs">
        {visible.map((record) => <article className={styles.railCard} data-selected={selected?.id === record.id || undefined} key={record.id}>
          <button type="button" className={styles.categorySelect} onClick={() => selectCategory(record.id)}>
            <span className={styles.icon}><FolderTree size={18} /></span>
            <span><strong>{record.name}</strong><small>{record.groups.length} {record.groups.length === 1 ? "group" : "groups"}</small></span>
            <ChevronRight size={17} />
          </button>
        </article>)}
      </aside>

      {selected ? <section className={styles.detail}>
        <header className={styles.detailHeader}>
          <div><span className={styles.icon}><FolderTree size={20} /></span><div><h2>{selected.name}</h2><p>{selected.isActive ? "Active program" : "Archived program"}</p></div></div>
          <div className={styles.detailActions}>
            <button type="button" onClick={() => openEdit(selected)}><Pencil size={14} /> Edit</button>
            {mode === "admin" ? <>
              <button type="button" onClick={() => openSupervisors(selected)}><ShieldUser size={14} /> Supervisors</button>
              <button type="button" onClick={() => toggleActive(selected)}><Archive size={14} /> {selected.isActive ? "Archive" : "Activate"}</button>
              <button type="button" className={styles.danger} disabled={selected.groups.length > 0 || selected.coaches.length > 0 || selected.supervisors.length > 0} title={selected.groups.length || selected.coaches.length || selected.supervisors.length ? "Referenced categories must be archived" : "Delete category"} onClick={() => { setDeleting(selected); setConfirmation(""); setError(""); }}><Trash2 size={14} /> Delete</button>
            </> : null}
          </div>
        </header>

        <p className={styles.programMeta}>{selectedGroups.length} {selectedGroups.length === 1 ? "group" : "groups"} · {selectedGroups.reduce((sum, group) => sum + group.memberCount, 0)} members · {selected.coaches.length} qualified coaches</p>
        <section className={styles.peopleStrip}><h3>Supervisors</h3><p>{selected.supervisors.length ? selected.supervisors.map((supervisor) => supervisor.name).join(" · ") : "No supervisors assigned"}</p></section>

        <AdminGroupsWorkspace
          key={selected.id}
          records={selectedGroups}
          coachOptions={coachOptions}
          clientOptions={clientOptions}
          categoryOptions={selectedCategoryOptions}
          embeddedCategoryId={selected.id}
        />
      </section> : null}
    </div> : <div className={styles.empty}><FolderTree size={30} /><h2>No programs found</h2><p>{mode === "admin" ? "Create a program or change the status filter." : "You are not supervising a program yet."}</p></div>}

    <EntityDialog open={editing !== null} onOpenChange={(open) => !open && !pending && setEditing(null)} title={editing === "new" ? "New program" : "Edit program"} description="Programs organize the studio's active groups." closeLabel="Close program editor" size="small"><EntityForm onSubmit={submit}><FormField label="Program name" required full><input autoFocus required maxLength={80} value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Burning Class" /></FormField>{mode === "admin" ? <label className={styles.check}><input type="checkbox" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} /> Program is active</label> : null}{error ? <FormErrorBanner>{error}</FormErrorBanner> : null}<FormActions onCancel={() => setEditing(null)} submitLabel="Save program" pendingLabel="Saving…" pending={pending} /></EntityForm></EntityDialog>

    <EntityDialog open={supervisorCategory !== null} onOpenChange={(open) => !open && !pending && setSupervisorCategory(null)} title={`${supervisorCategory?.name ?? "Program"} supervisors`} description="Supervisors can read and write groups, clients, coaches, and schedules in this program." closeLabel="Close supervisor editor" size="small">
      <div className={styles.supervisorPicker}>{coachOptions.map((coach) => { const checked = supervisorIds.includes(coach.id); return <label key={coach.id}><input type="checkbox" checked={checked} onChange={() => setSupervisorIds((current) => checked ? current.filter((id) => id !== coach.id) : [...current, coach.id])} /><span>{coach.fullName}</span></label>; })}</div>
      {error ? <FormErrorBanner>{error}</FormErrorBanner> : null}<div className={styles.dialogActions}><button type="button" className="mv-btn mv-btn-secondary" onClick={() => setSupervisorCategory(null)} disabled={pending}>Cancel</button><button type="button" className="mv-btn mv-btn-primary" onClick={saveSupervisors} disabled={pending}>{pending ? "Saving…" : "Save supervisors"}</button></div>
    </EntityDialog>

    <ConfirmDeleteDialog open={deleting !== null} onOpenChange={(open) => !open && !pending && setDeleting(null)} title={`Delete ${deleting?.name ?? "this program"}?`} description="This is only allowed when no group, coach qualification, or supervisor references the program." confirmationValue={confirmation} onConfirmationChange={setConfirmation} error={error} pending={pending} onConfirm={confirmDelete} closeLabel="Close program deletion" />
  </div>;
}
