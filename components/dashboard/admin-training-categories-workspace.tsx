"use client";

import { useMemo, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Archive, FolderTree, Pencil, Plus, ShieldUser, Trash2, UsersRound, X } from "lucide-react";
import { Dialog } from "radix-ui";

import {
  deleteTrainingCategory,
  saveTrainingCategory,
  setTrainingCategoryActive,
} from "@/app/actions/admin-training-categories";
import type { AdminTrainingCategoryRecord } from "@/lib/dashboard/training-category";
import { useDashboardToast } from "./dashboard-toast-provider";
import styles from "./admin-training-categories-workspace.module.css";

export function AdminTrainingCategoriesWorkspace({ records }: { records: AdminTrainingCategoryRecord[] }) {
  const router = useRouter();
  const { showToast } = useDashboardToast();
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<"All" | "Active" | "Archived">("All");
  const [editing, setEditing] = useState<AdminTrainingCategoryRecord | null | "new">(null);
  const [name, setName] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [deleting, setDeleting] = useState<AdminTrainingCategoryRecord | null>(null);
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");

  const visible = useMemo(
    () => records.filter((record) => status === "All" || (status === "Active" ? record.isActive : !record.isActive)),
    [records, status],
  );

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
        await saveTrainingCategory({ categoryId: editing === "new" ? null : editing?.id, name, isActive });
        setEditing(null);
        showToast(editing === "new" ? "Category created." : "Category updated.");
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

  return <div className={styles.page} aria-busy={pending}>
    <header className={styles.header}>
      <div><span>Programs</span><h1>Training categories</h1><p>Define program types independently from their scheduled groups and qualified coaches.</p></div>
      <button type="button" className="mv-btn mv-btn-primary" onClick={openCreate}><Plus size={16} /> New category</button>
    </header>
    <div className={styles.filters}>
      {(["All", "Active", "Archived"] as const).map((item) => <button type="button" key={item} data-active={status === item || undefined} onClick={() => setStatus(item)}>{item}</button>)}
    </div>
    {visible.length ? <div className={styles.grid}>{visible.map((record) => <article className={styles.card} key={record.id}>
      <header><div><span className={styles.icon}><FolderTree size={18} /></span><div><h2>{record.name}</h2><small>{record.slug}</small></div></div><b data-active={record.isActive || undefined}>{record.isActive ? "Active" : "Archived"}</b></header>
      <div className={styles.stats}><span><UsersRound size={15} /><strong>{record.groups.length}</strong> groups</span><span><ShieldUser size={15} /><strong>{record.coaches.length}</strong> coaches</span></div>
      <section><h3>Groups</h3><p>{record.groups.length ? record.groups.map((group) => group.name).join(" · ") : "No groups yet"}</p></section>
      <section><h3>Qualified coaches</h3><p>{record.coaches.length ? record.coaches.map((coach) => coach.name).join(" · ") : "No qualified coaches yet"}</p></section>
      <footer>
        <button type="button" onClick={() => openEdit(record)}><Pencil size={14} /> Edit</button>
        <button type="button" onClick={() => toggleActive(record)}><Archive size={14} /> {record.isActive ? "Archive" : "Activate"}</button>
        <button type="button" className={styles.danger} disabled={record.groups.length > 0 || record.coaches.length > 0} title={record.groups.length || record.coaches.length ? "Referenced categories must be archived" : "Delete category"} onClick={() => { setDeleting(record); setConfirmation(""); setError(""); }}><Trash2 size={14} /> Delete</button>
      </footer>
    </article>)}</div> : <div className={styles.empty}><FolderTree size={30} /><h2>No categories found</h2><p>Create a training category or change the status filter.</p></div>}

    <Dialog.Root open={editing !== null} onOpenChange={(open) => !open && !pending && setEditing(null)}><Dialog.Portal><Dialog.Overlay className={styles.overlay} /><Dialog.Content className={styles.modal}>
      <Dialog.Close className={styles.close} disabled={pending} aria-label="Close"><X size={17} /></Dialog.Close><Dialog.Title asChild><h2>{editing === "new" ? "New category" : "Edit category"}</h2></Dialog.Title><Dialog.Description>Category names identify programs. Scheduled cohorts are created separately as groups.</Dialog.Description>
      <form onSubmit={submit}><label>Category name<input autoFocus required maxLength={80} value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Burning Class" /></label><label className={styles.check}><input type="checkbox" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} /> Category is active</label>{error ? <p role="alert" className={styles.error}>{error}</p> : null}<footer><button type="button" onClick={() => setEditing(null)} disabled={pending}>Cancel</button><button type="submit" className="mv-btn mv-btn-primary" disabled={pending}>{pending ? "Saving…" : "Save category"}</button></footer></form>
    </Dialog.Content></Dialog.Portal></Dialog.Root>

    <Dialog.Root open={deleting !== null} onOpenChange={(open) => !open && !pending && setDeleting(null)}><Dialog.Portal><Dialog.Overlay className={styles.overlay} /><Dialog.Content className={styles.modal}>
      <Dialog.Close className={styles.close} disabled={pending} aria-label="Close"><X size={17} /></Dialog.Close><Dialog.Title asChild><h2>Delete {deleting?.name}?</h2></Dialog.Title><Dialog.Description>This is only allowed when no group or coach qualification references the category.</Dialog.Description><label>Type Delete<input value={confirmation} onChange={(event) => setConfirmation(event.target.value)} placeholder="Delete" /></label>{error ? <p role="alert" className={styles.error}>{error}</p> : null}<footer><button type="button" onClick={() => setDeleting(null)} disabled={pending}>Cancel</button><button type="button" className={styles.dangerButton} disabled={pending || confirmation !== "Delete"} onClick={confirmDelete}>Delete permanently</button></footer>
    </Dialog.Content></Dialog.Portal></Dialog.Root>
  </div>;
}
