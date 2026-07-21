"use client";

import { useMemo, useState, useTransition, type FormEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Archive, ChevronRight, FolderTree, Pencil, Plus, ShieldUser, Trash2, UsersRound, X } from "lucide-react";
import { Dialog } from "radix-ui";

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
        showToast(editing === "new" ? "Category created." : "Category updated.");
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
        showToast(record.isActive ? "Category archived." : "Category activated.");
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
        showToast("Category deleted.");
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
        showToast("Category supervisors updated.");
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
      <div><span>Programs</span><h1>Categories &amp; groups</h1><p>Select a training category to manage its supervisors, groups, members, coaches, and recurring sessions.</p></div>
      {mode === "admin" ? <button type="button" className="mv-btn mv-btn-primary" onClick={openCreate}><Plus size={16} /> New category</button> : null}
    </header>

    <div className={styles.filters}>
      {(["All", "Active", "Archived"] as const).map((item) => <button type="button" key={item} data-active={status === item || undefined} onClick={() => setStatus(item)}>{item}</button>)}
    </div>

    {visible.length ? <div className={styles.hub}>
      <aside className={styles.categoryRail} aria-label="Training categories">
        {visible.map((record) => <article className={styles.railCard} data-selected={selected?.id === record.id || undefined} key={record.id}>
          <button type="button" className={styles.categorySelect} onClick={() => selectCategory(record.id)}>
            <span className={styles.icon}><FolderTree size={18} /></span>
            <span><strong>{record.name}</strong><small>{record.groups.length} groups · {record.supervisors.length} supervisors</small></span>
            <ChevronRight size={17} />
          </button>
        </article>)}
      </aside>

      {selected ? <section className={styles.detail}>
        <header className={styles.detailHeader}>
          <div><span className={styles.icon}><FolderTree size={20} /></span><div><h2>{selected.name}</h2><p>{selected.isActive ? "Active training category" : "Archived training category"}</p></div></div>
          <div className={styles.detailActions}>
            <button type="button" onClick={() => openEdit(selected)}><Pencil size={14} /> Edit</button>
            {mode === "admin" ? <>
              <button type="button" onClick={() => openSupervisors(selected)}><ShieldUser size={14} /> Supervisors</button>
              <button type="button" onClick={() => toggleActive(selected)}><Archive size={14} /> {selected.isActive ? "Archive" : "Activate"}</button>
              <button type="button" className={styles.danger} disabled={selected.groups.length > 0 || selected.coaches.length > 0 || selected.supervisors.length > 0} title={selected.groups.length || selected.coaches.length || selected.supervisors.length ? "Referenced categories must be archived" : "Delete category"} onClick={() => { setDeleting(selected); setConfirmation(""); setError(""); }}><Trash2 size={14} /> Delete</button>
            </> : null}
          </div>
        </header>

        <div className={styles.summaryGrid}>
          <div><span><UsersRound size={15} /> Groups</span><strong>{selectedGroups.length}</strong></div>
          <div><span><UsersRound size={15} /> Clients</span><strong>{selectedGroups.reduce((sum, group) => sum + group.memberCount, 0)}</strong></div>
          <div><span><ShieldUser size={15} /> Qualified coaches</span><strong>{selected.coaches.length}</strong></div>
        </div>
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
    </div> : <div className={styles.empty}><FolderTree size={30} /><h2>No categories found</h2><p>{mode === "admin" ? "Create a training category or change the status filter." : "You are not supervising a category yet."}</p></div>}

    <Dialog.Root open={editing !== null} onOpenChange={(open) => !open && !pending && setEditing(null)}><Dialog.Portal><Dialog.Overlay className={styles.overlay} /><Dialog.Content className={styles.modal}>
      <Dialog.Close className={styles.close} disabled={pending} aria-label="Close"><X size={17} /></Dialog.Close><Dialog.Title asChild><h2>{editing === "new" ? "New category" : "Edit category"}</h2></Dialog.Title><Dialog.Description>Category names identify programs and contain their scheduled groups.</Dialog.Description>
      <form onSubmit={submit}><label>Category name<input autoFocus required maxLength={80} value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Burning Class" /></label>{mode === "admin" ? <label className={styles.check}><input type="checkbox" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} /> Category is active</label> : null}{error ? <p role="alert" className={styles.error}>{error}</p> : null}<footer><button type="button" onClick={() => setEditing(null)} disabled={pending}>Cancel</button><button type="submit" className="mv-btn mv-btn-primary" disabled={pending}>{pending ? "Saving…" : "Save category"}</button></footer></form>
    </Dialog.Content></Dialog.Portal></Dialog.Root>

    <Dialog.Root open={supervisorCategory !== null} onOpenChange={(open) => !open && !pending && setSupervisorCategory(null)}><Dialog.Portal><Dialog.Overlay className={styles.overlay} /><Dialog.Content className={styles.modal}>
      <Dialog.Close className={styles.close} disabled={pending} aria-label="Close"><X size={17} /></Dialog.Close><Dialog.Title asChild><h2>{supervisorCategory?.name} supervisors</h2></Dialog.Title><Dialog.Description>Supervisors can read and write groups, clients, coaches, and schedules in this category.</Dialog.Description>
      <div className={styles.supervisorPicker}>{coachOptions.map((coach) => { const checked = supervisorIds.includes(coach.id); return <label key={coach.id}><input type="checkbox" checked={checked} onChange={() => setSupervisorIds((current) => checked ? current.filter((id) => id !== coach.id) : [...current, coach.id])} /><span>{coach.fullName}</span></label>; })}</div>
      {error ? <p role="alert" className={styles.error}>{error}</p> : null}<footer><button type="button" onClick={() => setSupervisorCategory(null)} disabled={pending}>Cancel</button><button type="button" className="mv-btn mv-btn-primary" onClick={saveSupervisors} disabled={pending}>{pending ? "Saving…" : "Save supervisors"}</button></footer>
    </Dialog.Content></Dialog.Portal></Dialog.Root>

    <Dialog.Root open={deleting !== null} onOpenChange={(open) => !open && !pending && setDeleting(null)}><Dialog.Portal><Dialog.Overlay className={styles.overlay} /><Dialog.Content className={styles.modal}>
      <Dialog.Close className={styles.close} disabled={pending} aria-label="Close"><X size={17} /></Dialog.Close><Dialog.Title asChild><h2>Delete {deleting?.name}?</h2></Dialog.Title><Dialog.Description>This is only allowed when no group, coach qualification, or supervisor references the category.</Dialog.Description><label>Type Delete<input value={confirmation} onChange={(event) => setConfirmation(event.target.value)} placeholder="Delete" /></label>{error ? <p role="alert" className={styles.error}>{error}</p> : null}<footer><button type="button" onClick={() => setDeleting(null)} disabled={pending}>Cancel</button><button type="button" className={styles.dangerButton} disabled={pending || confirmation !== "Delete"} onClick={confirmDelete}>Delete permanently</button></footer>
    </Dialog.Content></Dialog.Portal></Dialog.Root>
  </div>;
}
