"use client";

import { Bell, Check, ChevronRight } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  markAllNotificationsRead,
  markNotificationRead,
} from "@/app/actions/notifications";
import type { DashboardRole } from "@/lib/auth/authorization-policy";
import { getSafeNotificationHref } from "@/lib/navigation/notification-href";
import styles from "./marvel-ops-expansion.module.css";

export type MarvelOpsNotification = {
  id: string;
  kind: "SESSION_REMINDER" | "RENEWAL_REMINDER" | "SYSTEM";
  status: "SENT" | "READ" | "FAILED";
  title: string;
  body: string;
  href: string | null;
  sentAt: string;
  readAt: string | null;
};

const label = (kind: MarvelOpsNotification["kind"]) =>
  kind === "SESSION_REMINDER"
    ? "Sessions"
    : kind === "RENEWAL_REMINDER"
      ? "Renewals"
      : "System";

export function MarvelOpsNotifications({
  items,
  role,
}: {
  items: MarvelOpsNotification[];
  role: DashboardRole;
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<"All" | MarvelOpsNotification["kind"]>("All");
  const [readIds, setReadIds] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const visible = useMemo(
    () => items.filter((item) => filter === "All" || item.kind === filter),
    [filter, items],
  );
  const unreadIds = items
    .filter((item) => !item.readAt && item.status !== "FAILED")
    .map((item) => item.id);

  function markAllRead() {
    if (!unreadIds.length) return;
    setMessage("");
    startTransition(async () => {
      try {
        await markAllNotificationsRead();
        setReadIds((current) => [...new Set([...current, ...unreadIds])]);
        setMessage("Notifications marked as read.");
        router.refresh();
      } catch {
        setMessage("Could not mark notifications as read.");
      }
    });
  }

  function openNotification(notice: MarvelOpsNotification, href: string) {
    setMessage("");
    startTransition(async () => {
      try {
        if (!notice.readAt && notice.status !== "FAILED") {
          await markNotificationRead(notice.id);
          setReadIds((current) => [...new Set([...current, notice.id])]);
        }
        router.push(href);
      } catch {
        setMessage("Could not open the notification.");
      }
    });
  }

  return (
    <div className={styles.page} aria-busy={pending}>
      <div className={styles.notificationToolbar}>
        <div className={styles.filterTabs}>
          {(["All", "SESSION_REMINDER", "RENEWAL_REMINDER", "SYSTEM"] as const).map((item) => (
            <button key={item} type="button" data-active={filter === item || undefined} onClick={() => setFilter(item)}>
              {item === "All" ? "All" : label(item)}
              <b>{item === "All" ? items.length : items.filter((notice) => notice.kind === item).length}</b>
            </button>
          ))}
        </div>
        <button className={styles.quietButton} type="button" onClick={markAllRead} disabled={pending || !unreadIds.length}>
          <Check size={15} /> {pending ? "Saving…" : "Mark all read"}
        </button>
      </div>
      {message ? <p role="status">{message}</p> : null}
      <div className={styles.noticeGroups}>
        {visible.length ? visible.map((notice) => {
          const safeHref = getSafeNotificationHref(notice.href, role);
          return (
            <article key={notice.id} data-read={notice.readAt || readIds.includes(notice.id) || undefined}>
              <span className={styles.noticeIcon} data-tone={notice.status === "FAILED" ? "red" : notice.kind === "RENEWAL_REMINDER" ? "amber" : "blue"}><Bell size={17} /></span>
              <div><strong>{notice.title}</strong><p>{notice.body}</p></div>
              {safeHref ? <button type="button" disabled={pending} onClick={() => openNotification(notice, safeHref)}>Open<ChevronRight size={14} /></button> : null}
              <time>{new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(notice.sentAt))}</time>
            </article>
          );
        }) : (
          <section className={styles.empty}><Bell size={24} /><h2>You&apos;re all caught up</h2><p>There are no notifications under this filter.</p></section>
        )}
      </div>
    </div>
  );
}
