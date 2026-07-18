"use client";

import { Bell, Check, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import styles from "./marvel-ops-expansion.module.css";

export type MarvelOpsNotification = { id: string; kind: "SESSION_REMINDER" | "RENEWAL_REMINDER" | "SYSTEM"; status: "SENT" | "READ" | "FAILED"; title: string; body: string; href: string | null; sentAt: string; readAt: string | null };
const label = (kind: MarvelOpsNotification["kind"]) => kind === "SESSION_REMINDER" ? "Sessions" : kind === "RENEWAL_REMINDER" ? "Renewals" : "System";

export function MarvelOpsNotifications({ items }: { items: MarvelOpsNotification[] }) {
  const router = useRouter(); const [filter, setFilter] = useState<"All" | MarvelOpsNotification["kind"]>("All"); const [readIds, setReadIds] = useState<string[]>([]);
  const visible = useMemo(() => items.filter((item) => filter === "All" || item.kind === filter), [filter, items]);
  return <div className={styles.page}><div className={styles.notificationToolbar}><div className={styles.filterTabs}>{(["All", "SESSION_REMINDER", "RENEWAL_REMINDER", "SYSTEM"] as const).map((item) => <button key={item} type="button" data-active={filter === item || undefined} onClick={() => setFilter(item)}>{item === "All" ? "All" : label(item)}<b>{item === "All" ? items.length : items.filter((notice) => notice.kind === item).length}</b></button>)}</div><button className={styles.quietButton} type="button" onClick={() => setReadIds(items.map((item) => item.id))}><Check size={15} /> Mark all read</button></div><div className={styles.noticeGroups}>{visible.length ? visible.map((notice) => <article key={notice.id} data-read={notice.readAt || readIds.includes(notice.id) || undefined}><span className={styles.noticeIcon} data-tone={notice.status === "FAILED" ? "red" : notice.kind === "RENEWAL_REMINDER" ? "amber" : "blue"}><Bell size={17} /></span><div><strong>{notice.title}</strong><p>{notice.body}</p></div>{notice.href ? <button type="button" onClick={() => { setReadIds((ids) => [...ids, notice.id]); router.push(notice.href!); }}>Open<ChevronRight size={14} /></button> : null}<time>{new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(notice.sentAt))}</time></article>) : <section className={styles.empty}><Bell size={24} /><h2>You&apos;re all caught up</h2><p>There are no notifications under this filter.</p></section>}</div></div>;
}
