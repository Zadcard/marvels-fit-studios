"use client";

import { useMemo, useState, useTransition, type FormEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Archive, ArrowLeft, ChevronRight, FolderTree, Pencil, Plus, ShieldUser, Trash2, UsersRound } from "lucide-react";

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
  const selectedCategory = useMemo(() => {
    if (!requestedCategoryId) return null;
    return records.find((record) => record.id === requestedCategoryId) ?? null;
  }, [records, requestedCategoryId]);

  function selectCategory(categoryId: string | null) {
    const next = new URLSearchParams(searchParams.toString());
    if (categoryId) {
      next.set("category", categoryId);
    } else {
      next.delete("category");
    }
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
        selectCategory(null);
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

  // Calculate metrics for overall studio
  const totalCategoriesCount = records.length;
  const totalGroupsCount = groupRecords.length;
  const totalMembersCount = groupRecords.reduce((sum, group) => sum + group.memberCount, 0);
  const totalSupervisorsCount = useMemo(() => {
    const supervisorSet = new Set<string>();
    records.forEach((record) => {
      record.supervisors.forEach((s) => supervisorSet.add(s.id));
    });
    return supervisorSet.size;
  }, [records]);

  const selectedCategoryGroups = useMemo(() => {
    if (!selectedCategory) return [];
    return groupRecords.filter((group) => group.categoryId === selectedCategory.id);
  }, [groupRecords, selectedCategory]);

  const selectedCategoryOptions = useMemo(() => {
    if (!selectedCategory) return [];
    return categoryOptions.filter((category) => category.id === selectedCategory.id);
  }, [categoryOptions, selectedCategory]);

  return (
    <div className={styles.page} aria-busy={pending}>
      {/* ── LEVEL 2: SELECTED PROGRAM DRILL-DOWN ── */}
      {selectedCategory ? (
        <>
          {/* Breadcrumb Navigation Bar */}
          <nav className={styles.breadcrumbNav} aria-label="Program navigation">
            <button
              type="button"
              className={styles.backBtn}
              onClick={() => selectCategory(null)}
            >
              <ArrowLeft size={16} /> Back to Programs
            </button>
            <div className={styles.breadcrumbTrail}>
              <span>Programs</span>
              <ChevronRight size={14} />
              <strong>{selectedCategory.name}</strong>
            </div>
          </nav>

          {/* Selected Category Header Banner */}
          <header className={styles.categoryDetailBanner}>
            <div className={styles.categoryBannerLeft}>
              <div>
                <h2>{selectedCategory.name}</h2>
                <div className={styles.supervisorList}>
                  <span
                    className={`${styles.statusTag} ${
                      selectedCategory.isActive ? styles.statusActive : styles.statusArchived
                    }`}
                  >
                    {selectedCategory.isActive ? "Active Program" : "Archived Program"}
                  </span>
                  {selectedCategory.supervisors.length > 0 ? (
                    selectedCategory.supervisors.map((sup) => (
                      <span key={sup.id} className={styles.supervisorChip}>
                        <ShieldUser size={12} /> {sup.name}
                      </span>
                    ))
                  ) : (
                    <span className={styles.supervisorChip} style={{ opacity: 0.6 }}>
                      No Supervisors Assigned
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className={styles.bannerActions}>
              <button
                type="button"
                className="mv-btn mv-btn-secondary"
                onClick={() => openEdit(selectedCategory)}
              >
                <Pencil size={14} /> Edit Name
              </button>
              {mode === "admin" ? (
                <>
                  <button
                    type="button"
                    className="mv-btn mv-btn-secondary"
                    onClick={() => openSupervisors(selectedCategory)}
                  >
                    <ShieldUser size={14} /> Supervisors ({selectedCategory.supervisors.length})
                  </button>
                  <button
                    type="button"
                    className="mv-btn mv-btn-secondary"
                    onClick={() => toggleActive(selectedCategory)}
                  >
                    <Archive size={14} /> {selectedCategory.isActive ? "Archive" : "Activate"}
                  </button>
                  <button
                    type="button"
                    className="mv-btn mv-btn-secondary"
                    style={{ color: "#ef4444", borderColor: "rgba(239,68,68,0.4)" }}
                    disabled={selectedCategory.groups.length > 0 || selectedCategory.coaches.length > 0 || selectedCategory.supervisors.length > 0}
                    onClick={() => {
                      setDeleting(selectedCategory);
                      setConfirmation("");
                      setError("");
                    }}
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </>
              ) : null}
            </div>
          </header>

          {/* Groups & Sessions Workspace inside this Category */}
          <AdminGroupsWorkspace
            key={selectedCategory.id}
            records={selectedCategoryGroups}
            coachOptions={coachOptions}
            clientOptions={clientOptions}
            categoryOptions={selectedCategoryOptions}
            embeddedCategoryId={selectedCategory.id}
          />
        </>
      ) : (
        /* ── LEVEL 1: ALL CATEGORIES CARDS GRID ── */
        <>
          {/* Top Header */}
          <header className={styles.header}>
            <div className={styles.headerTitle}>
              <h1>Programs &amp; Specializations</h1>
              <p>Explore program categories, active group series, supervisor oversight, and client rosters.</p>
            </div>

            {/* Metrics Bar */}
            <div className={styles.statsRow}>
              <div className={styles.statPill}>
                <span>Categories</span>
                <strong>{totalCategoriesCount}</strong>
              </div>
              <div className={styles.statDivider} />
              <div className={styles.statPill}>
                <span>Active Groups</span>
                <strong>{totalGroupsCount}</strong>
              </div>
              <div className={styles.statDivider} />
              <div className={styles.statPill}>
                <span>Total Members</span>
                <strong>{totalMembersCount}</strong>
              </div>
              <div className={styles.statDivider} />
              <div className={styles.statPill}>
                <span>Supervisors</span>
                <strong>{totalSupervisorsCount}</strong>
              </div>
            </div>
          </header>

          {/* Toolbar & Filter Options */}
          <div className={styles.toolbar}>
            <div className={styles.filters}>
              {(["All", "Active", "Archived"] as const).map((item) => (
                <button
                  type="button"
                  key={item}
                  data-active={status === item || undefined}
                  onClick={() => setStatus(item)}
                >
                  {item}
                </button>
              ))}
            </div>

            {mode === "admin" ? (
              <button type="button" className="mv-btn mv-btn-primary" onClick={openCreate}>
                <Plus size={16} /> New program
              </button>
            ) : null}
          </div>

          {/* Category Cards Grid */}
          {visible.length ? (
            <div className={styles.categoryGrid}>
              {visible.map((category) => {
                const categoryGroups = groupRecords.filter((g) => g.categoryId === category.id);
                const categoryMembers = categoryGroups.reduce((sum, g) => sum + g.memberCount, 0);

                return (
                  <article
                    key={category.id}
                    className={styles.categoryCard}
                    onClick={() => selectCategory(category.id)}
                  >
                    <div className={styles.categoryCardHeader}>
                      <div className={styles.categoryTitleGroup}>
                        <h3>{category.name}</h3>
                        <span
                          className={`${styles.statusTag} ${
                            category.isActive ? styles.statusActive : styles.statusArchived
                          }`}
                        >
                          {category.isActive ? "Active" : "Archived"}
                        </span>
                      </div>
                    </div>

                    {/* Stats Breakdown */}
                    <div className={styles.categoryCardStats}>
                      <div className={styles.cardStatItem}>
                        <span>Active Groups</span>
                        <strong>{categoryGroups.length}</strong>
                      </div>
                      <div className={styles.cardStatItem}>
                        <span>Enrolled Members</span>
                        <strong>{categoryMembers}</strong>
                      </div>
                    </div>

                    {/* Supervisors Info */}
                    <div className={styles.supervisorPreview}>
                      <ShieldUser size={14} />
                      {category.supervisors.length > 0 ? (
                        <span>
                          Supervisors:{" "}
                          <strong style={{ color: "#ffffff" }}>
                            {category.supervisors.map((s) => s.name).join(", ")}
                          </strong>
                        </span>
                      ) : (
                        <span style={{ opacity: 0.6 }}>No Supervisors Assigned</span>
                      )}
                    </div>

                    {/* Card Footer Actions */}
                    <div className={styles.categoryCardFooter}>
                      <button
                        type="button"
                        className={styles.viewGroupsBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          selectCategory(category.id);
                        }}
                      >
                        <UsersRound size={14} /> View Groups ({categoryGroups.length}) <ChevronRight size={14} />
                      </button>

                      <div className={styles.cardSubActions} onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          title="Edit Category"
                          onClick={() => openEdit(category)}
                        >
                          <Pencil size={14} />
                        </button>
                        {mode === "admin" ? (
                          <button
                            type="button"
                            title="Manage Supervisors"
                            onClick={() => openSupervisors(category)}
                          >
                            <ShieldUser size={14} />
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className={styles.empty}>
              <FolderTree size={32} />
              <h2>No program categories found</h2>
              <p>
                {mode === "admin"
                  ? "Create a new program category or change the status filter."
                  : "You are not supervising a program category yet."}
              </p>
            </div>
          )}
        </>
      )}

      {/* Edit / Create Program Dialog */}
      <EntityDialog
        open={editing !== null}
        onOpenChange={(open) => !open && !pending && setEditing(null)}
        title={editing === "new" ? "New program" : "Edit program"}
        description="Programs organize active groups and training categories."
        closeLabel="Close program editor"
        size="small"
      >
        <EntityForm onSubmit={submit}>
          <FormField label="Program name" required full>
            <input
              autoFocus
              required
              maxLength={80}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Calisthenics, Football, Muscle Gain"
            />
          </FormField>
          {mode === "admin" ? (
            <label className={styles.check}>
              <input
                type="checkbox"
                checked={isActive}
                onChange={(event) => setIsActive(event.target.checked)}
              />{" "}
              Program is active
            </label>
          ) : null}
          {error ? <FormErrorBanner>{error}</FormErrorBanner> : null}
          <FormActions
            onCancel={() => setEditing(null)}
            submitLabel="Save program"
            pendingLabel="Saving…"
            pending={pending}
          />
        </EntityForm>
      </EntityDialog>

      {/* Supervisor Manager Dialog */}
      <EntityDialog
        open={supervisorCategory !== null}
        onOpenChange={(open) => !open && !pending && setSupervisorCategory(null)}
        title={`${supervisorCategory?.name ?? "Program"} supervisors`}
        description="Supervisors gain management access over groups, rosters, and recurring schedules in this program."
        closeLabel="Close supervisor editor"
        size="small"
      >
        <div className={styles.supervisorPicker}>
          {coachOptions.map((coach) => {
            const checked = supervisorIds.includes(coach.id);
            return (
              <label key={coach.id}>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() =>
                    setSupervisorIds((current) =>
                      checked ? current.filter((id) => id !== coach.id) : [...current, coach.id]
                    )
                  }
                />
                <span>{coach.fullName}</span>
              </label>
            );
          })}
        </div>
        {error ? <FormErrorBanner>{error}</FormErrorBanner> : null}
        <div className={styles.dialogActions}>
          <button
            type="button"
            className="mv-btn mv-btn-secondary"
            onClick={() => setSupervisorCategory(null)}
            disabled={pending}
          >
            Cancel
          </button>
          <button
            type="button"
            className="mv-btn mv-btn-primary"
            onClick={saveSupervisors}
            disabled={pending}
          >
            {pending ? "Saving…" : "Save supervisors"}
          </button>
        </div>
      </EntityDialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDeleteDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && !pending && setDeleting(null)}
        title={`Delete ${deleting?.name ?? "this program"}?`}
        description="This is only allowed when no group, coach qualification, or supervisor references the program."
        confirmationValue={confirmation}
        onConfirmationChange={setConfirmation}
        error={error}
        pending={pending}
        onConfirm={confirmDelete}
        closeLabel="Close program deletion"
      />
    </div>
  );
}
