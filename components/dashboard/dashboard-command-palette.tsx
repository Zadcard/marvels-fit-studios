"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  Flag,
  Search,
  UserRoundPlus,
  WalletCards,
  type LucideIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";

import type { DashboardRole } from "@/lib/auth/authorization-policy";
import { getDashboardNav } from "@/lib/navigation/dashboard-nav";
import styles from "./dashboard-command-palette.module.css";

type CommandItem = {
  label: string;
  detail?: string;
  kind: "Action" | "Page" | "Client" | "Coach";
  href: string;
  icon: LucideIcon | string;
  tone?: "red" | "green" | "violet" | "neutral" | "avatar-red" | "avatar-violet" | "avatar-blue";
};

type CommandGroup = { label: string; items: CommandItem[] };

const adminPeople: CommandItem[] = [
  { label: "Omar Tarek", detail: "Strength Class · Active", kind: "Client", href: "/admin/clients?profile=Omar%20Tarek", icon: "OT", tone: "avatar-red" },
  { label: "Sara Nabil", detail: "PT · Active", kind: "Client", href: "/admin/clients?profile=Sara%20Nabil", icon: "SN", tone: "avatar-violet" },
  { label: "Ali Hassan", detail: "Strength Class · Active", kind: "Client", href: "/admin/clients?profile=Ali%20Hassan", icon: "AH", tone: "avatar-blue" },
  { label: "Nada Sherif", detail: "Ladies Class · Active", kind: "Client", href: "/admin/clients?profile=Nada%20Sherif", icon: "NS", tone: "green" },
];

const coachPeople: CommandItem[] = [
  { label: "Omar Tarek", detail: "Strength Class · Member", kind: "Client", href: "/coach/clients", icon: "OT", tone: "avatar-red" },
  { label: "Sara Nabil", detail: "PT · Member", kind: "Client", href: "/coach/clients", icon: "SN", tone: "avatar-violet" },
  { label: "Ali Hassan", detail: "Strength Class · Member", kind: "Client", href: "/coach/clients", icon: "AH", tone: "avatar-blue" },
];

const coaches: CommandItem[] = [
  { label: "Ahmed Waheed", detail: "Head Coach · Strength", kind: "Coach", href: "/admin/coaches", icon: "AW", tone: "avatar-red" },
  { label: "Mariam Soliman", detail: "Ladies & Rehab", kind: "Coach", href: "/admin/coaches", icon: "MS", tone: "avatar-violet" },
  { label: "Youssef Abdelatif", detail: "Athlete Conditioning", kind: "Coach", href: "/admin/coaches", icon: "YA", tone: "avatar-blue" },
];

export function DashboardCommandPalette({ open, role, onClose }: { open: boolean; role: DashboardRole; onClose: () => void }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const pages = getDashboardNav(role).map((item) => ({
    label: item.label,
    detail: item.description,
    kind: "Page" as const,
    href: item.href,
    icon: item.icon,
    tone: "neutral" as const,
  }));

  const groups = useMemo<CommandGroup[]>(() => {
    const actions: CommandItem[] = role === "admin"
      ? [
          { label: "Mark attendance", detail: "Jump to the live session", kind: "Action", href: "/admin/attendance", icon: CheckCircle2, tone: "green" },
          { label: "Record cash out", kind: "Action", href: "/admin/subscriptions", icon: WalletCards, tone: "red" },
          { label: "New member", kind: "Action", href: "/admin/clients", icon: UserRoundPlus, tone: "red" },
          { label: "Add lead", kind: "Action", href: "/admin/join-requests", icon: Flag, tone: "violet" },
        ]
      : [{ label: "Mark attendance", detail: "Open today’s session", kind: "Action", href: "/coach", icon: CheckCircle2, tone: "green" }];
    const all: CommandGroup[] = [
      { label: "Actions", items: actions },
      { label: "Go to", items: pages },
      { label: "People", items: role === "admin" ? adminPeople : coachPeople },
      ...(role === "admin" ? [{ label: "Coaches", items: coaches }] : []),
    ];
    const value = query.trim().toLowerCase();
    if (!value) return all.slice(0, 3);
    return all
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => `${item.label} ${item.detail ?? ""}`.toLowerCase().includes(value)),
      }))
      .filter((group) => group.items.length);
  }, [pages, query, role]);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    const timer = window.setTimeout(() => inputRef.current?.focus(), 0);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose, open]);

  if (!open) return null;

  function navigate(href: string) {
    onClose();
    router.push(href);
  }

  return (
    <div className={styles.overlay} role="presentation" onMouseDown={onClose}>
      <section className={styles.palette} role="dialog" aria-modal="true" aria-label="Search or jump to" onMouseDown={(event) => event.stopPropagation()}>
        <header className={styles.searchRow}>
          <Search size={18} aria-hidden="true" />
          <label className="sr-only" htmlFor="command-query">Search or jump to</label>
          <input ref={inputRef} id="command-query" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search or jump to…" />
          <kbd>ESC</kbd>
        </header>
        <div className={styles.results}>
          {groups.length === 0 ? (
            <div className={styles.empty}>
              <Search size={26} aria-hidden="true" />
              <strong>No matches for “{query}”</strong>
              <span>Try a client, coach, or page name.</span>
            </div>
          ) : groups.map((group) => (
            <section className={styles.group} key={group.label} aria-label={group.label}>
              <h2>{group.label}</h2>
              {group.items.map((item) => (
                  <button type="button" key={`${item.kind}-${item.label}`} onClick={() => navigate(item.href)}>
                    <span className={`${styles.iconTile} ${styles[item.tone ?? "neutral"]}`} aria-hidden="true">
                      {typeof item.icon === "string" ? item.icon : <item.icon size={16} />}
                    </span>
                    <span className={styles.itemCopy}>
                      <span>{item.label}</span>
                      {item.detail ? <small>{item.detail}</small> : null}
                    </span>
                    <span className={styles.kind}>{item.kind}</span>
                  </button>
              ))}
            </section>
          ))}
        </div>
      </section>
    </div>
  );
}
