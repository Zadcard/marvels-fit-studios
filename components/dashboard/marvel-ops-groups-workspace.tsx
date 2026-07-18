"use client";

import { useState } from "react";
import { CalendarDays, ChevronRight, Clock3, ShieldUser, Users, X } from "lucide-react";
import { useRouter } from "next/navigation";

import type { AdminGroupRecord } from "@/lib/dashboard/admin-group-record";
import styles from "./marvel-ops-groups-workspace.module.css";

type Tone = "red" | "amber" | "violet" | "blue" | "green";
export type MarvelOpsGroup = AdminGroupRecord & { tone: Tone; attendanceSessionId: string | null };

export function MarvelOpsGroupsWorkspace({ groups }: { groups: MarvelOpsGroup[] }) {
  const [selected, setSelected] = useState<MarvelOpsGroup | null>(null);

  return <div className={styles.page}>
    <section className={styles.groups} aria-label="Recurring groups">
      {groups.map((group) => {
        const pct = group.capacity ? Math.round(group.memberCount / group.capacity * 100) : 0;
        return <article key={group.id}>
          <button type="button" className={styles.card} onClick={() => setSelected(group)} aria-label={`Open ${group.name}`}>
            <header><div><h2>{group.name}</h2><span>{group.scheduleSummary}</span></div>{group.capacity !== null && group.memberCount >= group.capacity ? <b>Full</b> : null}</header>
            <div className={styles.cells}><span><small>Schedule</small><strong>{group.scheduleSummary}</strong></span><span><small>Category</small><strong>{group.trainingCategory}</strong></span></div>
            <p><i data-tone={group.tone}>{initials(group.coachName)}</i><b>{group.coachName}</b><small>{group.capacityLabel} members</small><em><strong data-tone={group.tone} style={{ width: `${pct}%` }} /></em><ChevronRight size={15} /></p>
          </button>
        </article>;
      })}
    </section>
    {!groups.length ? <section className={styles.empty}>No groups are in the database yet.</section> : null}
    {selected ? <GroupDrawer group={selected} close={() => setSelected(null)} /> : null}
  </div>;
}

function initials(name: string) {
  return name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

function GroupDrawer({ group, close }: { group: MarvelOpsGroup; close: () => void }) {
  const router = useRouter();
  const pct = group.capacity ? Math.round(group.memberCount / group.capacity * 100) : 0;
  return <div className={styles.overlay} onMouseDown={close}>
    <aside className={styles.drawer} role="dialog" aria-modal="true" aria-label={`${group.name} details`} onMouseDown={(event) => event.stopPropagation()}>
      <header><button type="button" className={styles.close} onClick={close} aria-label="Close group details"><X size={18} /></button><span>Recurring group</span><h2>{group.name}</h2><p><i data-tone={group.tone}>{initials(group.coachName)}</i>{group.coachName}</p></header>
      <section className={styles.stats}><div><span>Capacity</span><strong>{group.memberCount}<small>of {group.capacity ?? "—"}</small></strong><i><b data-tone={group.tone} style={{ width: `${pct}%` }} /></i></div><div><span>Schedule</span><strong>{group.scheduleSummary}</strong><small>{group.groupType}</small></div></section>
      <dl className={styles.details}><div><dt><Clock3 size={14} /> Schedule</dt><dd>{group.scheduleSummary}</dd></div><div><dt><ShieldUser size={14} /> Coach</dt><dd>{group.coachName}</dd></div><div><dt><Users size={14} /> Members</dt><dd>{group.memberCount} enrolled</dd></div><div><dt><CalendarDays size={14} /> Status</dt><dd>{group.isActive ? "Active" : "Inactive"}</dd></div></dl>
      <section className={styles.focus}><span>Training focus</span><p>{group.notes || "No group notes recorded yet."}</p></section>
      <section className={styles.members}><header><span>Current members</span><small>{group.memberCount} enrolled</small></header>{group.members.map((member) => <button type="button" key={member.id} onClick={() => router.push(`/admin/clients?profile=${encodeURIComponent(member.fullName)}`)}><i data-tone={group.tone}>{initials(member.fullName)}</i><b>{member.fullName}</b><ChevronRight size={14} /></button>)}</section>
      <footer><button type="button" onClick={close}>Close</button><button type="button" disabled={!group.attendanceSessionId} onClick={() => group.attendanceSessionId && router.push(`/admin/attendance?session=${encodeURIComponent(group.attendanceSessionId)}`)}>Open attendance</button></footer>
    </aside>
  </div>;
}
