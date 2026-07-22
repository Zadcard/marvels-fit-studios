"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  Flag,
  Search,
  UserRoundPlus,
  type LucideIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Dialog } from "radix-ui";

import type { DashboardRole } from "@/lib/auth/authorization-policy";
import type { DashboardCommandItem } from "@/lib/dashboard/dashboard-command-item";
import { getDashboardNav } from "@/lib/navigation/dashboard-nav";
import styles from "./dashboard-command-palette.module.css";

type PaletteCommandItem = {
  label: string;
  detail?: string;
  kind: "Action" | "Page" | "Client" | "Coach" | "Lead" | "Group";
  href: string;
  icon: LucideIcon | string;
  tone?: "red" | "green" | "violet" | "neutral" | "avatar-red" | "avatar-violet" | "avatar-blue";
};

type CommandGroup = { label: string; items: PaletteCommandItem[] };

export function DashboardCommandPalette({
  open,
  role,
  commandItems,
  onClose,
}: {
  open: boolean;
  role: DashboardRole;
  commandItems: DashboardCommandItem[];
  onClose: () => void;
}) {
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
    const actions: PaletteCommandItem[] = role === "admin"
      ? [
          { label: "Mark attendance", detail: "Jump to the live session", kind: "Action", href: "/admin/schedule", icon: CheckCircle2, tone: "green" },
          { label: "New member", kind: "Action", href: "/admin/clients?new=1", icon: UserRoundPlus, tone: "red" },
          { label: "Add lead", kind: "Action", href: "/admin/leads?new=1", icon: Flag, tone: "violet" },
        ]
      : [];
    const people: PaletteCommandItem[] = commandItems
      .filter((item) => item.kind === "Client")
      .map((item) => ({ ...item, icon: item.initials }));
    const coaches: PaletteCommandItem[] = commandItems
      .filter((item) => item.kind === "Coach")
      .map((item) => ({ ...item, icon: item.initials }));
    const leads: PaletteCommandItem[] = commandItems
      .filter((item) => item.kind === "Lead")
      .map((item) => ({ ...item, icon: item.initials }));
    const studioGroups: PaletteCommandItem[] = commandItems
      .filter((item) => item.kind === "Group")
      .map((item) => ({ ...item, icon: item.initials }));
    const all: CommandGroup[] = [
      { label: "Actions", items: actions },
      { label: "Go to", items: pages },
      { label: "People", items: people },
      ...(role === "admin" ? [{ label: "Coaches", items: coaches }] : []),
      ...(role === "admin" ? [{ label: "Leads", items: leads }] : []),
      ...(role === "admin" ? [{ label: "Groups", items: studioGroups }] : []),
    ].filter((group) => group.items.length > 0);
    const value = query.trim().toLowerCase();
    if (!value) return all;
    return all
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => `${item.label} ${item.detail ?? ""}`.toLowerCase().includes(value)),
      }))
      .filter((group) => group.items.length);
  }, [commandItems, pages, query, role]);

  useEffect(() => {
    if (!open) return;
    setQuery("");
  }, [open]);

  function navigate(href: string) {
    onClose();
    router.push(href);
  }

  return (
    <Dialog.Root open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className={styles.overlay} />
        <Dialog.Content
          className={styles.palette}
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            inputRef.current?.focus();
          }}
        >
          <Dialog.Title className="sr-only">Search or jump to</Dialog.Title>
          <Dialog.Description className="sr-only">
            Search clients, coaches, pages, and quick actions.
          </Dialog.Description>
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
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
