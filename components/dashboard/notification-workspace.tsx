"use client";

import Link from "next/link";
import { ArrowUpRight, Bell, Check, Radio } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { markNotificationRead } from "@/app/actions/notifications";
import type { Database } from "@/lib/supabase/database.types";
import styles from "./notification-workspace.module.css";

type Notification = Pick<
  Database["public"]["Tables"]["Notification"]["Row"],
  "id" | "kind" | "status" | "title" | "body" | "href" | "sentAt" | "readAt"
>;

const formatTime = (value: string) =>
  new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Cairo",
  }).format(new Date(value));

export function NotificationWorkspace({
  notifications,
}: {
  notifications: Notification[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const unread = notifications.filter((item) => item.status !== "READ");

  const markRead = (id: string) => {
    startTransition(async () => {
      await markNotificationRead(id);
      router.refresh();
    });
  };

  return (
    <main className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.heroCopy}>
          <span className={styles.kicker}><Radio size={14} /> Studio signal</span>
          <h1>Catch what changed.</h1>
          <p>Bookings, renewals, and studio updates — ordered for action, not noise.</p>
        </div>
        <div className={styles.counter} aria-label={`${unread.length} unread notifications`}>
          <span>Unread</span>
          <strong>{String(unread.length).padStart(2, "0")}</strong>
          <small>{notifications.length} total signals</small>
        </div>
      </header>

      <section className={styles.feed} aria-labelledby="signal-feed-title">
        <div className={styles.sectionHeading}>
          <div>
            <span>Live feed</span>
            <h2 id="signal-feed-title">Your signal queue</h2>
          </div>
          <Bell aria-hidden="true" />
        </div>

        {notifications.length ? (
          <div className={styles.list}>
            {notifications.map((item, index) => {
              const isUnread = item.status !== "READ";
              return (
                <article className={styles.signal} data-unread={isUnread} key={item.id}>
                  <div className={styles.index}>{String(index + 1).padStart(2, "0")}</div>
                  <div className={styles.signalBody}>
                    <div className={styles.meta}>
                      <span>{item.kind.replaceAll("_", " ")}</span>
                      <time dateTime={item.sentAt}>{formatTime(item.sentAt)}</time>
                    </div>
                    <h3>{item.title}</h3>
                    <p>{item.body}</p>
                  </div>
                  <div className={styles.actions}>
                    {item.href ? (
                      <Link className={styles.openButton} href={item.href}>
                        Open <ArrowUpRight size={16} />
                      </Link>
                    ) : null}
                    {isUnread ? (
                      <button className={styles.readButton} disabled={pending} onClick={() => markRead(item.id)}>
                        <Check size={16} /> Mark read
                      </button>
                    ) : (
                      <span className={styles.readState}><Check size={15} /> Read</span>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className={styles.empty}>
            <Bell size={30} />
            <strong>All quiet.</strong>
            <p>Session and renewal signals will land here when the studio has something for you.</p>
          </div>
        )}
      </section>
    </main>
  );
}
