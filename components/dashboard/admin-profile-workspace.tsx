"use client";

import { useState, useTransition, type FormEvent } from "react";
import Link from "next/link";
import { Check, KeyRound, Mail, Save, ShieldCheck, UserRound } from "lucide-react";
import { saveAdminProfile } from "@/app/actions/admin-profile";
import type { AdminProfileRecord } from "@/lib/mocks/admin-profile";
import styles from "./admin-profile-workspace.module.css";

const fallback: AdminProfileRecord = { fullName: "Admin User", roleLabel: "Studio Admin", email: "No email", phone: "No phone on file", location: "Studio HQ", bio: "Manages studio operations.", initials: "AU", joinedLabel: "Joined recently", credentialsNote: "Password updates require the current password." };
type Metric = { id: string; label: string; value: string; detail: string; iconKey: "shield-check" | "timer-reset" | "trophy" | "bell-ring" };

export function AdminProfileWorkspace({ profile: initialProfile, metrics = [] }: { profile?: AdminProfileRecord | null; metrics?: Metric[] }) {
  const initial = initialProfile ?? fallback;
  const [profile, setProfile] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [message, setMessage] = useState("Account details are current.");
  const [pending, startTransition] = useTransition();
  const dirty = profile.fullName !== saved.fullName || profile.email !== saved.email;
  function submit(event: FormEvent) { event.preventDefault(); setMessage(""); startTransition(async () => { try { await saveAdminProfile({ fullName: profile.fullName, email: profile.email }); setSaved(profile); setMessage("Admin identity saved."); } catch (caught) { setMessage(caught instanceof Error ? caught.message : "Could not save profile."); } }); }
  return <div className={styles.page} aria-busy={pending}>
    <header className={styles.hero}><div><span className={styles.kicker}>Operator identity</span><h1>Own the controls.</h1><p>Your persisted admin identity, access posture and live operational footprint.</p></div><button form="admin-profile-form" type="submit" className="mv-btn mv-btn-primary" disabled={!dirty || pending}><Save size={17} /> {pending ? "Saving…" : "Save identity"}</button></header>
    <section className={styles.metrics}>{metrics.slice(0,4).map((metric, index) => <article key={metric.id} data-dark={index === 3 || undefined}><span>{metric.label}</span><strong>{metric.value}</strong><small>{metric.detail}</small></article>)}</section>
    <section className={styles.workspace}><form id="admin-profile-form" onSubmit={submit} className={styles.form}><div className={styles.sectionTitle}><div><span>Identity record</span><h2>How the studio sees you</h2></div><UserRound size={22} /></div><label>Full name<input required value={profile.fullName} onChange={(event) => setProfile((value) => ({ ...value, fullName: event.target.value }))} /></label><label>Email<input required type="email" value={profile.email} onChange={(event) => setProfile((value) => ({ ...value, email: event.target.value }))} /></label><div className={styles.readonly}><span>Role<strong>{profile.roleLabel}</strong></span><span>Base<strong>{profile.location}</strong></span></div><p className={styles.message} role="status"><Check size={15} /> {dirty ? "Unsaved identity changes." : message}</p></form>
      <aside className={styles.account}><div className={styles.identity}><span>{profile.initials}</span><div><small>{profile.roleLabel}</small><h2>{profile.fullName}</h2><p>{profile.joinedLabel}</p></div></div><div className={styles.contact}><Mail size={16} /><span><small>Primary email</small><strong>{profile.email}</strong></span></div><section><ShieldCheck size={20} /><div><strong>Admin access</strong><p>{profile.credentialsNote}</p></div></section><Link href="/change-password" className="mv-btn mv-btn-secondary"><KeyRound size={17} /> Change password</Link></aside>
    </section>
  </div>;
}
