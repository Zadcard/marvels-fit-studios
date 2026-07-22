"use client";

import { useMemo, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2, Users, UsersRound } from "lucide-react";

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
import { ConfirmDeleteDialog, EntityDialog } from "@/components/ui/entity-form";
import styles from "./admin-groups-workspace.module.css";

type Props = {
  records: AdminGroupRecord[];
  coachOptions: AdminGroupCoachOption[];
  clientOptions: AdminGroupClientOption[];
  categoryOptions: AdminGroupCategoryOption[];
  embeddedCategoryId?: string;
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
}: Props) {
  const router = useRouter();
  const { showToast } = useDashboardToast();
  const [isPending, startTransition] = useTransition();
  const [categoryFilter, setCategoryFilter] = useState(embeddedCategoryId ?? "All");
  const [activeFilter, setActiveFilter] = useState<"All" | "Active" | "Inactive">(
    "All",
  );
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
        (categoryFilter === "All" ||
          record.categoryId === categoryFilter) &&
        (activeFilter === "All" ||
          (activeFilter === "Active" ? record.isActive : !record.isActive)),
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
    (client) => !managingGroup?.members.some((member) => member.id === client.id),
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
          series: form.hasSchedule
            ? {
                templateId: form.templateId,
                durationMinutes: Number(form.durationMinutes),
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
        const description = caught instanceof Error ? caught.message : "Could not save the group.";
        setError(description);
        showToast(description, "warning");
      }
    });
  }

  function confirmDelete() {
    if (!editingGroup) return;
    setError("");
    startTransition(async () => {
      try {
        await deleteAdminGroup({
          groupId: editingGroup.id,
          confirmationText: deleteText,
        });
        setDeleteOpen(false);
        setEditorOpen(false);
        setDeleteText("");
        showToast("Group deleted.");
        router.refresh();
      } catch (caught) {
        const description = caught instanceof Error ? caught.message : "Could not delete the group.";
        setError(description);
        showToast(description, "warning");
      }
    });
  }

  function changeMembership(clientId: string, action: "add" | "remove") {
    if (!membersId) return;
    setError("");
    startTransition(async () => {
      try {
        await setAdminGroupMembership({ groupId: membersId, clientId, action });
        setAddClientId("");
        showToast(action === "add" ? "Member added." : "Member removed.");
        router.refresh();
      } catch (caught) {
        const description = caught instanceof Error ? caught.message : "Could not update members.";
        setError(description);
        showToast(description, "warning");
      }
    });
  }

  return (
    <div className={styles.page} aria-busy={isPending}>
      <header className={styles.header}>
        <button type="button" className="mv-btn mv-btn-primary" onClick={openCreate}>
          <Plus size={17} /> New group
        </button>
      </header>

      <div className={styles.toolbar}>
        <div className={styles.filters}>
          {!embeddedCategoryId ? <label>
            Training
            <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
              <option value="All">All categories</option>
              {categoryOptions.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
            </select>
          </label> : null}
          <label>
            Sort by
            <select value={sortKey} onChange={(event) => setSortKey(event.target.value as typeof sortKey)}>
              <option value="name">Name</option>
              <option value="coach">Coach</option>
              <option value="members">Members</option>
            </select>
          </label>
          <label>
            Status
            <select
              value={activeFilter}
              onChange={(event) =>
                setActiveFilter(event.target.value as typeof activeFilter)
              }
            >
              {["All", "Active", "Inactive"].map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {filtered.length ? (
        <div className={styles.grid}>
          {filtered.map((record) => {
            return (
              <article className={styles.card} key={record.id}>
                <div className={styles.cardTop}>
                  <div>
                    <h2>{record.name}</h2>
                    <div className={styles.days}>{record.scheduleSummary}</div>
                  </div>
                  <span className={styles.statusPill} data-active={record.isActive || undefined}>
                    {record.isActive ? "Active" : "Inactive"}
                  </span>
                </div>

                <dl className={styles.statRow}>
                  {!embeddedCategoryId ? <div><dt>Program</dt><dd>{record.categoryName}</dd></div> : null}
                  <div><dt>Type</dt><dd>{record.groupType}</dd></div>
                </dl>

                <div className={styles.coachLine}>
                  <span className={styles.avatar} style={{ background: gradientFor(record.coachName) }}>
                    {coachInitials(record.coachName)}
                  </span>
                  <div>
                    <div className={styles.coachName}>{record.coachName}</div>
                    <div className={styles.memberCount}>{record.memberCount ? `${record.memberCount} ${record.memberCount === 1 ? "member" : "members"}` : "Members to be determined"}</div>
                  </div>
                </div>

                <div className={styles.cardActions}>
                  <button type="button" onClick={() => openEdit(record)}>
                    <Pencil size={15} /> Edit
                  </button>
                  <button type="button" onClick={() => { setMembersId(record.id); setAddClientId(""); setError(""); }}>
                    <Users size={15} /> Members ({record.memberCount})
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className={styles.empty}>
          <UsersRound size={30} />
          <h2>No groups yet</h2>
          <p>Create a recurring group and assign a coach and training category.</p>
          <button type="button" className="mv-btn mv-btn-primary" onClick={openCreate}>
            New group
          </button>
        </div>
      )}

      {/* Editor */}
      <EntityDialog open={editorOpen} onOpenChange={setEditorOpen} title={editingId ? "Edit group" : "New group"} description="Set the coach, program, members, recurring schedule, and status." closeLabel="Close group editor">
            <form className={styles.form} onSubmit={submitGroup}>
              <label className={styles.full}>
                Group name
                <input required value={form.name} onChange={(event) => setForm((value) => ({ ...value, name: event.target.value }))} />
              </label>
              <label>
                Type
                <select value={form.groupType} onChange={(event) => setForm((value) => ({ ...value, groupType: event.target.value as GroupForm["groupType"] }))}>
                  {["Group", "Private"].map((option) => <option key={option}>{option}</option>)}
                </select>
              </label>
              <label>
                Program
                <select required disabled={Boolean(embeddedCategoryId)} value={form.categoryId} onChange={(event) => setForm((value) => ({ ...value, categoryId: event.target.value, coachId: "" }))}>
                  <option value="">Select a category</option>
                  {categoryOptions.filter((option) => option.isActive || option.id === form.categoryId).map((option) => <option key={option.id} value={option.id}>{option.name}{option.isActive ? "" : " (archived)"}</option>)}
                </select>
              </label>
              <label>
                Coach
                <select required value={form.coachId} onChange={(event) => setForm((value) => ({ ...value, coachId: event.target.value }))}>
                  <option value="">Select a coach</option>
                  {coachOptions.filter((coach) => coach.qualifiedCategoryIds.includes(form.categoryId)).map((coach) => <option key={coach.id} value={coach.id}>{coach.fullName}</option>)}
                </select>
              </label>
              <fieldset className={`${styles.full} ${styles.clientPicker}`}>
                <legend>Clients in this group</legend>
                <p>Select clients now or update membership later. Clients can belong to more than one group.</p>
                <div>
                  {clientOptions.length ? clientOptions.map((client) => {
                    const checked = form.clientIds.includes(client.id);
                    return <label key={client.id}>
                      <input type="checkbox" checked={checked} onChange={() => setForm((value) => ({
                        ...value,
                        clientIds: checked
                          ? value.clientIds.filter((id) => id !== client.id)
                          : [...value.clientIds, client.id],
                      }))} />
                      <span>{client.fullName}</span>
                    </label>;
                  }) : <p>No clients are available.</p>}
                </div>
              </fieldset>
              <label className={`${styles.full} ${styles.checkbox}`}>
                <input type="checkbox" checked={form.isActive} onChange={(event) => setForm((value) => ({ ...value, isActive: event.target.checked }))} />
                Group is active
              </label>
              <label className={`${styles.full} ${styles.checkbox}`}>
                <input
                  type="checkbox"
                  checked={form.hasSchedule}
                  onChange={(event) => setForm((value) => ({ ...value, hasSchedule: event.target.checked }))}
                />
                This group meets on a recurring schedule
              </label>
              {form.hasSchedule ? (
                <div className={styles.full}>
                  <label>Duration minutes<input type="number" min="15" max="480" required value={form.durationMinutes} onChange={(event) => setForm((value) => ({ ...value, durationMinutes: event.target.value }))} /></label>
                  <label>Starts on<input type="date" required value={form.startsOn} onChange={(event) => setForm((value) => ({ ...value, startsOn: event.target.value }))} /></label>
                  <label>Ends on<input type="date" value={form.endsOn} onChange={(event) => setForm((value) => ({ ...value, endsOn: event.target.value }))} /></label>
                  <span>Repeats on</span>
                  <SeriesSlotsEditor slots={form.slots} onChange={(slots) => setForm((value) => ({ ...value, slots }))} />
                </div>
              ) : null}
              <label className={styles.full}>
                Notes
                <input value={form.notes} onChange={(event) => setForm((value) => ({ ...value, notes: event.target.value }))} placeholder="Anything the team should know about this group" />
              </label>
              {error ? <p className={styles.error} role="alert">{error}</p> : null}
              <div className={styles.formActions}>
                {editingId ? (
                  <button type="button" className={styles.deleteButton} onClick={() => { setDeleteText(""); setDeleteOpen(true); }}>
                    <Trash2 size={16} /> Delete
                  </button>
                ) : <span />}
                <span />
                <button type="button" className="mv-btn mv-btn-secondary" onClick={() => setEditorOpen(false)}>Cancel</button>
                <button type="submit" className="mv-btn mv-btn-primary" disabled={isPending}>{isPending ? "Saving…" : "Save group"}</button>
              </div>
            </form>
      </EntityDialog>

      {/* Members */}
      <EntityDialog open={!!managingGroup} onOpenChange={(open) => !open && setMembersId(null)} title={`${managingGroup?.name ?? "Group"} members`} description="Add or remove clients in this group." closeLabel="Close group members" size="small">
            {managingGroup ? (
              <>
                <div className={styles.memberList}>
                  {managingGroup.members.length ? managingGroup.members.map((member) => (
                    <div className={styles.memberRow} key={member.id}>
                      <span>{member.fullName}</span>
                      <button type="button" onClick={() => changeMembership(member.id, "remove")} disabled={isPending}>Remove</button>
                    </div>
                  )) : <p>No members in this group yet.</p>}
                </div>
                <div className={styles.addRow}>
                  <label className="sr-only" htmlFor="add-member">Add member</label>
                  <select id="add-member" value={addClientId} onChange={(event) => setAddClientId(event.target.value)}>
                    <option value="">Add a client…</option>
                    {assignableClients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.fullName}
                      </option>
                    ))}
                  </select>
                  <button type="button" className="mv-btn mv-btn-primary" disabled={!addClientId || isPending} onClick={() => changeMembership(addClientId, "add")}>Add</button>
                </div>
                {error ? <p className={styles.error} role="alert">{error}</p> : null}
              </>
            ) : null}
      </EntityDialog>

      {/* Delete confirm */}
      <ConfirmDeleteDialog open={deleteOpen} onOpenChange={setDeleteOpen} title="Delete this group?" description="Members are unassigned but not deleted. Type Delete to confirm." confirmationValue={deleteText} onConfirmationChange={setDeleteText} error={error} pending={isPending} onConfirm={confirmDelete} closeLabel="Close group deletion" />
    </div>
  );
}
