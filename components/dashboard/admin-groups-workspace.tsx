"use client";

import { useMemo, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, Pencil, Plus, Users, UsersRound } from "lucide-react";

import {
  deleteAdminGroup,
  saveAdminGroup,
  setAdminGroupMembership,
} from "@/app/actions/admin-groups";
import type {
  AdminGroupClientOption,
  AdminGroupCoachOption,
  AdminGroupCategoryOption,
  AdminGroupRecord,
} from "@/lib/dashboard/admin-group-record";
import { useDashboardToast } from "./dashboard-toast-provider";
import { SeriesSlotsEditor } from "./series-slots-editor";
import type { RecurringSessionTemplateSlot } from "@/lib/dashboard/recurring-session-template";
import { getStudioDateKey } from "@/lib/time/studio-time";
import { ConfirmDeleteDialog, EntityDialog, EntityForm, FormActions, FormErrorBanner, FormField } from "@/components/ui/entity-form";
import styles from "./admin-groups-workspace.module.css";

type Props = {
  records: AdminGroupRecord[];
  coachOptions: AdminGroupCoachOption[];
  clientOptions: AdminGroupClientOption[];
  categoryOptions: AdminGroupCategoryOption[];
  embeddedCategoryId?: string;
  // "owner" is the scoped view a coach gets for groups they're assigned to
  // coach: everything is editable except the recurring schedule (times),
  // and there's no create/delete -- those stay admin/supervisor actions.
  mode?: "full" | "owner";
};

type GroupForm = {
  name: string;
  groupType: AdminGroupRecord["groupType"];
  categoryId: string;
  coachId: string;
  isActive: boolean;
  notes: string;
  hasSchedule: boolean;
  templateId: string | null;
  durationMinutes: string;
  startsOn: string;
  endsOn: string;
  slots: RecurringSessionTemplateSlot[];
  clientIds: string[];
};

const emptyForm: GroupForm = {
  name: "",
  groupType: "Group",
  categoryId: "",
  coachId: "",
  isActive: true,
  notes: "",
  hasSchedule: false,
  templateId: null,
  durationMinutes: "60",
  startsOn: getStudioDateKey(),
  endsOn: "",
  slots: [{ weekday: 1, localStartTime: "18:00" }],
  clientIds: [],
};

const AVATAR_GRADIENTS = [
  "linear-gradient(135deg,#e62429,#ff4f54)",
  "linear-gradient(135deg,#3b82f6,#8b5cf6)",
  "linear-gradient(135deg,#8b5cf6,#ec4899)",
  "linear-gradient(135deg,#f59e0b,#ef4444)",
  "linear-gradient(135deg,#059669,#25d366)",
  "linear-gradient(135deg,#14b8a6,#3b82f6)",
];

function coachInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function gradientFor(name: string) {
  let hash = 0;
  for (let index = 0; index < name.length; index += 1) {
    hash = (hash + name.charCodeAt(index)) % AVATAR_GRADIENTS.length;
  }
  return AVATAR_GRADIENTS[hash];
}

export function AdminGroupsWorkspace({
  records,
  coachOptions,
  clientOptions,
  categoryOptions,
  embeddedCategoryId,
  mode = "full",
}: Props) {
  const canEditTimes = mode !== "owner";
  const canCreateOrDelete = mode !== "owner";
  const router = useRouter();
  const { showToast } = useDashboardToast();
  const [isPending, startTransition] = useTransition();
  const [categoryFilter, setCategoryFilter] = useState(embeddedCategoryId ?? "All");
  const [activeFilter, setActiveFilter] = useState<"All" | "Active" | "Inactive">("All");
  const [sortKey, setSortKey] = useState<"name" | "coach" | "members">("name");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<GroupForm>(emptyForm);
  const [membersId, setMembersId] = useState<string | null>(null);
  const [addClientId, setAddClientId] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteText, setDeleteText] = useState("");
  const [error, setError] = useState("");

  const filtered = useMemo(() => {
    const matches = records.filter(
      (record) =>
        (categoryFilter === "All" || record.categoryId === categoryFilter) &&
        (activeFilter === "All" || (activeFilter === "Active" ? record.isActive : !record.isActive)),
    );
    return [...matches].sort((a, b) => {
      if (sortKey === "coach") return a.coachName.localeCompare(b.coachName);
      if (sortKey === "members") return b.memberCount - a.memberCount;
      return a.name.localeCompare(b.name);
    });
  }, [records, categoryFilter, activeFilter, sortKey]);

  const managingGroup = records.find((record) => record.id === membersId) ?? null;
  const editingGroup = records.find((record) => record.id === editingId) ?? null;

  const assignableClients = clientOptions.filter(
    (client) => client.groupId !== membersId,
  );

  function openCreate() {
    setEditingId(null);
    const firstCategory = categoryOptions.find((category) => category.id === embeddedCategoryId)
      ?? categoryOptions.find((category) => category.isActive);
    setForm({ ...emptyForm, categoryId: firstCategory?.id ?? "", clientIds: [] });
    setError("");
    setEditorOpen(true);
  }

  function openEdit(record: AdminGroupRecord) {
    setEditingId(record.id);
    setForm({
      name: record.name,
      groupType: record.groupType,
      categoryId: record.categoryId,
      coachId: record.coachId,
      isActive: record.isActive,
      notes: record.notes,
      hasSchedule: record.series != null,
      templateId: record.series?.templateId ?? null,
      durationMinutes: record.series ? String(record.series.durationMinutes) : "60",
      startsOn: record.series?.startsOn ?? getStudioDateKey(),
      endsOn: record.series?.endsOn ?? "",
      slots: record.series?.slots ?? [{ weekday: 1, localStartTime: "18:00" }],
      clientIds: record.members.map((member) => member.id),
    });
    setError("");
    setEditorOpen(true);
  }

  function submitGroup(event: FormEvent) {
    event.preventDefault();
    setError("");
    startTransition(async () => {
      try {
        await saveAdminGroup({
          groupId: editingId,
          name: form.name,
          groupType: form.groupType,
          categoryId: form.categoryId,
          coachId: form.coachId,
          isActive: form.isActive,
          notes: form.notes,
          clientIds: form.clientIds,
          series: canEditTimes && form.hasSchedule
            ? {
                templateId: form.templateId,
                durationMinutes: Number(form.durationMinutes) || 60,
                startsOn: form.startsOn,
                endsOn: form.endsOn || undefined,
                slots: form.slots,
              }
            : undefined,
        });
        setEditorOpen(false);
        showToast(editingId ? "Group updated." : "Group created.");
        router.refresh();
      } catch (caught) {
        const message = caught instanceof Error ? caught.message : "Could not save the group.";
        setError(message);
        showToast(message, "warning");
      }
    });
  }

  function confirmDelete() {
    if (!editingId) return;
    setError("");
    startTransition(async () => {
      try {
        await deleteAdminGroup({ groupId: editingId, confirmationText: deleteText });
        setDeleteOpen(false);
        setEditorOpen(false);
        setDeleteText("");
        showToast("Group deleted.");
        router.refresh();
      } catch (caught) {
        const message = caught instanceof Error ? caught.message : "Could not delete the group.";
        setError(message);
        showToast(message, "warning");
      }
    });
  }

  function changeMembership(clientId: string, action: "add" | "remove") {
    if (!membersId) return;
    setError("");
    startTransition(async () => {
      try {
        await setAdminGroupMembership({ groupId: membersId, clientId, action });
        if (action === "add") setAddClientId("");
        showToast(action === "add" ? "Member added to group." : "Member removed from group.");
        router.refresh();
      } catch (caught) {
        const message = caught instanceof Error ? caught.message : "Could not update membership.";
        setError(message);
        showToast(message, "warning");
      }
    });
  }

  return (
    <div className={styles.page} aria-busy={isPending}>
      {/* ── Toolbar: All controls & + New Group on the exact same row ── */}
      <div className={styles.toolbar}>
        <div className={styles.filters}>
          {!embeddedCategoryId ? (
            <div className={styles.filterField}>
              <span>Training</span>
              <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
                <option value="All">All categories</option>
                {categoryOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <div className={styles.filterField}>
            <span>Sort by</span>
            <select value={sortKey} onChange={(event) => setSortKey(event.target.value as typeof sortKey)}>
              <option value="name">Name</option>
              <option value="coach">Coach</option>
              <option value="members">Members</option>
            </select>
          </div>

          <div className={styles.filterField}>
            <span>Status</span>
            <select
              value={activeFilter}
              onChange={(event) => setActiveFilter(event.target.value as typeof activeFilter)}
            >
              {["All", "Active", "Inactive"].map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </div>
        </div>

        {canCreateOrDelete ? (
          <button type="button" className="mv-btn mv-btn-primary" onClick={openCreate}>
            <Plus size={16} /> New group
          </button>
        ) : null}
      </div>

      {/* ── Group Cards Grid ── */}
      {filtered.length ? (
        <div className={styles.grid}>
          {filtered.map((record) => {
            return (
              <article className={styles.card} key={record.id}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardTitleGroup}>
                    <h2>{record.name}</h2>
                    <span className={styles.typeBadge}>{record.groupType} Series</span>
                  </div>
                  <span
                    className={`${styles.statusPill} ${
                      record.isActive ? styles.statusActive : styles.statusInactive
                    }`}
                  >
                    {record.isActive ? "Active" : "Inactive"}
                  </span>
                </div>

                {/* Schedule Chip */}
                <div className={styles.schedulePill}>
                  <CalendarClock size={14} />
                  <span>{record.scheduleSummary || "No recurring sessions set"}</span>
                </div>

                {/* Coach & Members */}
                <div className={styles.coachLine}>
                  <span className={styles.avatar} style={{ background: gradientFor(record.coachName) }}>
                    {coachInitials(record.coachName)}
                  </span>
                  <div className={styles.coachInfo}>
                    <div className={styles.coachName}>{record.coachName}</div>
                    <div className={styles.memberCount}>
                      👥 {record.memberCount ? `${record.memberCount} ${record.memberCount === 1 ? "member" : "members"}` : "No members enrolled"}
                    </div>
                  </div>
                </div>

                {/* Action Bar */}
                <div className={styles.cardActions}>
                  <button type="button" onClick={() => openEdit(record)}>
                    <Pencil size={14} /> Edit Group
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMembersId(record.id);
                      setAddClientId("");
                      setError("");
                    }}
                  >
                    <Users size={14} /> Roster &amp; Slots ({record.memberCount})
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className={styles.empty}>
          <UsersRound size={32} />
          <h2>No groups yet</h2>
          <p>
            {canCreateOrDelete
              ? "Create a recurring group series and assign a coach and training category."
              : "No groups are assigned to you yet."}
          </p>
          {canCreateOrDelete ? (
            <button type="button" className="mv-btn mv-btn-primary" onClick={openCreate}>
              + New group
            </button>
          ) : null}
        </div>
      )}

      {/* ── Group Editor Modal aligned with Client Edit Modal ── */}
      <EntityDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        title={editingId ? "Edit group" : "New group"}
        description="Configure coach assignment, training category, recurring schedule, and roster."
        closeLabel="Close group editor"
      >
        <EntityForm onSubmit={submitGroup}>
          <FormField label="Group name" required full>
            <input
              required
              value={form.name}
              onChange={(event) => setForm((value) => ({ ...value, name: event.target.value }))}
              placeholder="e.g. Burning Class, Ladies Morning"
            />
          </FormField>

          <FormField label="Type">
            <select
              value={form.groupType}
              onChange={(event) => setForm((value) => ({ ...value, groupType: event.target.value as GroupForm["groupType"] }))}
            >
              {["Group", "Private"].map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </FormField>

          <FormField label="Program category">
            <select
              required
              disabled={Boolean(embeddedCategoryId)}
              value={form.categoryId}
              onChange={(event) => setForm((value) => ({ ...value, categoryId: event.target.value, coachId: "" }))}
            >
              <option value="">Select a category</option>
              {categoryOptions
                .filter((option) => option.isActive || option.id === form.categoryId)
                .map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                    {option.isActive ? "" : " (archived)"}
                  </option>
                ))}
            </select>
          </FormField>

          <FormField label="Assigned Coach" full>
            <select
              required
              value={form.coachId}
              onChange={(event) => setForm((value) => ({ ...value, coachId: event.target.value }))}
            >
              <option value="">Select a coach</option>
              {coachOptions.map((coach) => (
                <option key={coach.id} value={coach.id}>
                  {coach.fullName}
                </option>
              ))}
            </select>
          </FormField>

          <fieldset className={`${styles.clientPicker}`} style={{ gridColumn: "1 / -1" }}>
            <legend>Enrolled Clients</legend>
            <p>Select clients now or update roster later. Clients can belong to more than one group.</p>
            <div>
              {clientOptions.length ? (
                clientOptions.map((client) => {
                  const checked = form.clientIds.includes(client.id);
                  return (
                    <label key={client.id}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          setForm((value) => ({
                            ...value,
                            clientIds: checked
                              ? value.clientIds.filter((id) => id !== client.id)
                              : [...value.clientIds, client.id],
                          }))
                        }
                      />
                      <span>{client.fullName}</span>
                    </label>
                  );
                })
              ) : (
                <p>No clients available.</p>
              )}
            </div>
          </fieldset>

          <div style={{ gridColumn: "1 / -1", display: "grid", gap: "10px" }}>
            <label className={styles.check}>
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) => setForm((value) => ({ ...value, isActive: event.target.checked }))}
              />
              Group is active
            </label>
            {canEditTimes ? (
              <label className={styles.check}>
                <input
                  type="checkbox"
                  checked={form.hasSchedule}
                  onChange={(event) => setForm((value) => ({ ...value, hasSchedule: event.target.checked }))}
                />
                This group meets on a recurring schedule
              </label>
            ) : null}
          </div>

          {!canEditTimes ? (
            <div className={styles.readOnlySchedule} style={{ gridColumn: "1 / -1" }}>
              <span>Schedule</span>
              <p>{editingGroup?.scheduleSummary || "Sessions to be determined"}</p>
              <small>Only a supervisor or admin can change when this group meets.</small>
            </div>
          ) : null}

          {canEditTimes && form.hasSchedule ? (
            <div style={{ gridColumn: "1 / -1", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <FormField label="Duration minutes">
                <input
                  type="number"
                  min="15"
                  max="480"
                  required
                  value={form.durationMinutes}
                  onChange={(event) => setForm((value) => ({ ...value, durationMinutes: event.target.value }))}
                />
              </FormField>
              <FormField label="Starts on">
                <input
                  type="date"
                  required
                  value={form.startsOn}
                  onChange={(event) => setForm((value) => ({ ...value, startsOn: event.target.value }))}
                />
              </FormField>
              <FormField label="Ends on" full>
                <input
                  type="date"
                  value={form.endsOn}
                  onChange={(event) => setForm((value) => ({ ...value, endsOn: event.target.value }))}
                />
              </FormField>
              <div style={{ gridColumn: "1 / -1" }}>
                <span style={{ fontSize: "0.72rem", color: "#8f8f8f", fontWeight: 700 }}>RECURRING WEEKLY SLOTS</span>
                <SeriesSlotsEditor slots={form.slots} onChange={(slots) => setForm((value) => ({ ...value, slots }))} />
              </div>
            </div>
          ) : null}

          <FormField label="Notes" full>
            <input
              value={form.notes}
              onChange={(event) => setForm((value) => ({ ...value, notes: event.target.value }))}
              placeholder="Internal operational notes"
            />
          </FormField>

          {error ? <FormErrorBanner>{error}</FormErrorBanner> : null}

          <FormActions
            onCancel={() => setEditorOpen(false)}
            onDelete={editingId && canCreateOrDelete ? () => { setDeleteText(""); setDeleteOpen(true); } : undefined}
            deleteLabel="Delete group"
            submitLabel="Save group"
            pendingLabel="Saving…"
            pending={isPending}
          />
        </EntityForm>
      </EntityDialog>

      {/* Roster & Members Manager Modal */}
      <EntityDialog
        open={!!managingGroup}
        onOpenChange={(open) => !open && setMembersId(null)}
        title={`${managingGroup?.name ?? "Group"} roster & members`}
        description="Add or remove clients in this group series."
        closeLabel="Close roster manager"
        size="small"
      >
        {managingGroup ? (
          <>
            <div className={styles.memberList}>
              {managingGroup.members.length ? (
                managingGroup.members.map((member) => (
                  <div className={styles.memberRow} key={member.id}>
                    <span>{member.fullName}</span>
                    <button
                      type="button"
                      onClick={() => changeMembership(member.id, "remove")}
                      disabled={isPending}
                    >
                      Remove
                    </button>
                  </div>
                ))
              ) : (
                <p style={{ color: "#8f8f8f", fontSize: "0.78rem" }}>No members enrolled in this group yet.</p>
              )}
            </div>
            <div className={styles.addRow}>
              <select value={addClientId} onChange={(event) => setAddClientId(event.target.value)}>
                <option value="">Add a client to roster…</option>
                {assignableClients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.fullName}
                    {client.groupId ? " (currently in another group)" : ""}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="mv-btn mv-btn-primary"
                disabled={!addClientId || isPending}
                onClick={() => changeMembership(addClientId, "add")}
              >
                Add
              </button>
            </div>
            {error ? <FormErrorBanner>{error}</FormErrorBanner> : null}
          </>
        ) : null}
      </EntityDialog>

      {/* Delete Group Confirmation Modal */}
      <ConfirmDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete this group?"
        description="Members will be unassigned from this group. Type Delete to confirm."
        confirmationValue={deleteText}
        onConfirmationChange={setDeleteText}
        error={error}
        pending={isPending}
        onConfirm={confirmDelete}
        closeLabel="Close group deletion"
      />
    </div>
  );
}
