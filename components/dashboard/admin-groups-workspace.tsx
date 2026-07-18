"use client";

import { useMemo, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "radix-ui";
import { Pencil, Plus, Search, Trash2, Users, UsersRound, X } from "lucide-react";

import {
  deleteAdminGroup,
  saveAdminGroup,
  setAdminGroupMembership,
} from "@/app/actions/admin-groups";
import type {
  AdminGroupClientOption,
  AdminGroupCoachOption,
  AdminGroupRecord,
} from "@/lib/dashboard/admin-group-record";
import {
  adminTrainingCategoryFilters,
} from "@/lib/dashboard/admin-dashboard-data";
import { trainingCategoryLabels } from "@/lib/dashboard/client-domain-labels";
import styles from "./admin-groups-workspace.module.css";

type Props = {
  records: AdminGroupRecord[];
  coachOptions: AdminGroupCoachOption[];
  clientOptions: AdminGroupClientOption[];
};

type GroupForm = {
  name: string;
  groupType: AdminGroupRecord["groupType"];
  trainingCategory: AdminGroupRecord["trainingCategory"];
  coachId: string;
  capacity: string;
  isActive: boolean;
  notes: string;
};

const emptyForm: GroupForm = {
  name: "",
  groupType: "Group",
  trainingCategory: "General fitness",
  coachId: "",
  capacity: "",
  isActive: true,
  notes: "",
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

function fillColor(percent: number) {
  if (percent >= 100) return "var(--ops-danger)";
  if (percent >= 85) return "var(--ops-warning)";
  return "linear-gradient(90deg,#e62429,#ff4f54)";
}

export function AdminGroupsWorkspace({
  records,
  coachOptions,
  clientOptions,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] =
    useState<(typeof adminTrainingCategoryFilters)[number]>("All");
  const [activeFilter, setActiveFilter] = useState<"All" | "Active" | "Inactive">(
    "All",
  );
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<GroupForm>(emptyForm);
  const [membersId, setMembersId] = useState<string | null>(null);
  const [addClientId, setAddClientId] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteText, setDeleteText] = useState("");
  const [error, setError] = useState("");

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return records.filter(
      (record) =>
        (categoryFilter === "All" ||
          record.trainingCategory === categoryFilter) &&
        (activeFilter === "All" ||
          (activeFilter === "Active" ? record.isActive : !record.isActive)) &&
        (!term ||
          [record.name, record.coachName, record.trainingCategory]
            .join(" ")
            .toLowerCase()
            .includes(term)),
    );
  }, [records, search, categoryFilter, activeFilter]);

  const managingGroup = records.find((record) => record.id === membersId) ?? null;
  const editingGroup = records.find((record) => record.id === editingId) ?? null;
  const assignableClients = clientOptions.filter(
    (client) => client.groupId !== membersId,
  );

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setEditorOpen(true);
  }

  function openEdit(record: AdminGroupRecord) {
    setEditingId(record.id);
    setForm({
      name: record.name,
      groupType: record.groupType,
      trainingCategory: record.trainingCategory,
      coachId: record.coachId,
      capacity: record.capacity != null ? String(record.capacity) : "",
      isActive: record.isActive,
      notes: record.notes,
    });
    setError("");
    setEditorOpen(true);
  }

  function submitGroup(event: FormEvent) {
    event.preventDefault();
    setError("");
    startTransition(async () => {
      try {
        await saveAdminGroup({ groupId: editingId, ...form });
        setEditorOpen(false);
        router.refresh();
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Could not save the group.");
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
        router.refresh();
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Could not delete the group.");
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
        router.refresh();
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Could not update members.");
      }
    });
  }

  return (
    <div className={styles.page} aria-busy={isPending}>
      <header className={styles.header}>
        <div>
          <span className={styles.kicker}><UsersRound size={14} /> Training groups</span>
          <h1>Run every group.</h1>
          <p>Coach, training category, recurring times, and membership for each recurring group.</p>
        </div>
        <button type="button" className="mv-btn mv-btn-primary" onClick={openCreate}>
          <Plus size={17} /> New group
        </button>
      </header>

      <div className={styles.toolbar}>
        <div className={styles.search}>
          <Search size={18} />
          <label className="sr-only" htmlFor="group-search">Search groups</label>
          <input
            id="group-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Group, coach, or training category"
          />
        </div>
        <div className={styles.filters}>
          <label>
            Training
            <select
              value={categoryFilter}
              onChange={(event) =>
                setCategoryFilter(event.target.value as typeof categoryFilter)
              }
            >
              {adminTrainingCategoryFilters.map((option) => (
                <option key={option}>{option}</option>
              ))}
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
            const percent =
              record.capacity && record.capacity > 0
                ? Math.min(100, Math.round((record.memberCount / record.capacity) * 100))
                : 0;
            const isFull =
              record.capacity != null && record.memberCount >= record.capacity;
            return (
              <article className={styles.card} key={record.id}>
                <div className={styles.cardTop}>
                  <div>
                    <h2>{record.name}</h2>
                    <div className={styles.days}>{record.scheduleSummary}</div>
                  </div>
                  {isFull ? (
                    <span className={styles.fullBadge}>Full</span>
                  ) : (
                    <span className={styles.statusPill} data-active={record.isActive || undefined}>
                      {record.isActive ? "Active" : "Inactive"}
                    </span>
                  )}
                </div>

                <dl className={styles.statRow}>
                  <div><dt>Category</dt><dd>{record.trainingCategory}</dd></div>
                  <div><dt>Type</dt><dd>{record.groupType}</dd></div>
                </dl>

                <div className={styles.coachLine}>
                  <span className={styles.avatar} style={{ background: gradientFor(record.coachName) }}>
                    {coachInitials(record.coachName)}
                  </span>
                  <div>
                    <div className={styles.coachName}>{record.coachName}</div>
                    <div className={styles.memberCount}>{record.capacityLabel} members</div>
                  </div>
                  <div className={styles.bar}>
                    <i style={{ width: `${percent}%`, background: fillColor(percent) }} />
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
      <Dialog.Root open={editorOpen} onOpenChange={setEditorOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className={styles.overlay} />
          <Dialog.Content className={styles.editor}>
            <Dialog.Title asChild><h2>{editingId ? "Edit group" : "New group"}</h2></Dialog.Title>
            <Dialog.Description>Set the coach, training category, capacity, and status.</Dialog.Description>
            <Dialog.Close className={styles.close} aria-label="Close"><X size={18} /></Dialog.Close>
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
                Training category
                <select value={form.trainingCategory} onChange={(event) => setForm((value) => ({ ...value, trainingCategory: event.target.value as GroupForm["trainingCategory"] }))}>
                  {trainingCategoryLabels.map((option) => <option key={option}>{option}</option>)}
                </select>
              </label>
              <label>
                Coach
                <select required value={form.coachId} onChange={(event) => setForm((value) => ({ ...value, coachId: event.target.value }))}>
                  <option value="">Select a coach</option>
                  {coachOptions.map((coach) => <option key={coach.id} value={coach.id}>{coach.fullName}</option>)}
                </select>
              </label>
              <label>
                Capacity (optional)
                <input inputMode="numeric" value={form.capacity} onChange={(event) => setForm((value) => ({ ...value, capacity: event.target.value }))} placeholder="No limit" />
              </label>
              <label className={`${styles.full} ${styles.checkbox}`}>
                <input type="checkbox" checked={form.isActive} onChange={(event) => setForm((value) => ({ ...value, isActive: event.target.checked }))} />
                Group is active
              </label>
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
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Members */}
      <Dialog.Root open={!!managingGroup} onOpenChange={(open) => !open && setMembersId(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className={styles.overlay} />
          <Dialog.Content className={styles.editor}>
            <Dialog.Title asChild><h2>{managingGroup?.name ?? "Group"} members</h2></Dialog.Title>
            <Dialog.Description>Add or remove clients in this group.</Dialog.Description>
            <Dialog.Close className={styles.close} aria-label="Close"><X size={18} /></Dialog.Close>
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
                        {client.fullName}{client.groupId ? " (in another group)" : ""}
                      </option>
                    ))}
                  </select>
                  <button type="button" className="mv-btn mv-btn-primary" disabled={!addClientId || isPending} onClick={() => changeMembership(addClientId, "add")}>Add</button>
                </div>
                {error ? <p className={styles.error} role="alert">{error}</p> : null}
              </>
            ) : null}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Delete confirm */}
      <Dialog.Root open={deleteOpen} onOpenChange={setDeleteOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className={styles.overlay} />
          <Dialog.Content className={styles.confirm}>
            <Dialog.Title asChild><h2>Delete this group?</h2></Dialog.Title>
            <Dialog.Description>Members are unassigned but not deleted. Type Delete to confirm.</Dialog.Description>
            <label className={styles.full}>
              Confirmation
              <input value={deleteText} onChange={(event) => setDeleteText(event.target.value)} placeholder="Delete" />
            </label>
            {error ? <p className={styles.error} role="alert">{error}</p> : null}
            <div className={styles.formActions}>
              <span />
              <button type="button" className="mv-btn mv-btn-secondary" onClick={() => setDeleteOpen(false)}>Cancel</button>
              <button type="button" className={styles.deleteButton} disabled={deleteText !== "Delete" || isPending} onClick={confirmDelete}>Delete permanently</button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
