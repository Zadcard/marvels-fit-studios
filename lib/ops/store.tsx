"use client";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { signOut as nextAuthSignOut } from "next-auth/react";

import { markAllAttendance, markAttendance } from "@/app/actions/admin-attendance";
import { deleteAdminClient, saveAdminClient } from "@/app/actions/admin-clients";
import { deleteCoach as deleteCoachAction, saveCoach as saveCoachAction } from "@/app/actions/admin-coaches";
import { recordStudioExpense } from "@/app/actions/admin-expenses";
import { deleteAdminGroup, saveAdminGroup } from "@/app/actions/admin-groups";
import { approveLeadAsClient, createAdminLead, deleteLead as deleteLeadAction } from "@/app/actions/admin-leads";
import { decideScheduleChangeRequest } from "@/app/actions/admin-schedule-change-requests";
import { mutateAdminSubscriptionLifecycle, saveAdminSubscription } from "@/app/actions/admin-subscriptions";
import { markAllNotificationsRead } from "@/app/actions/notifications";

import * as D from "./data";
import { mockOpsData, type OpsData, type OpsInitial, type OpsSelf } from "./live";
import type { AttState, ConfirmReq, Toast } from "./types";

// Ops class labels (intake UI) → domain training-category labels the backend
// actions accept.
const OPS_CAT_TO_DOMAIN: Record<string, string> = {
  "Strength Class": "Muscle gain",
  "Burning Class": "Fat loss",
  "Ladies Class": "General fitness",
  "Athlete Conditioning": "Other sport",
  Calisthenics: "Calisthenics",
  Rehab: "Rehab",
  PT: "General fitness",
};
const domainCategory = (label: string) =>
  OPS_CAT_TO_DOMAIN[label] ?? (label || "General fitness");

const EXPENSE_CATEGORY: Record<string, "SUPPLIES" | "MAINTENANCE" | "COACH_PAYMENT" | "RENT_UTILITIES" | "MARKETING" | "OTHER"> = {
  Salaries: "COACH_PAYMENT",
  "Studio needs": "SUPPLIES",
  Supplies: "SUPPLIES",
  "Rent & bills": "RENT_UTILITIES",
  Maintenance: "MAINTENANCE",
  Other: "OTHER",
};
const EXPENSE_METHOD: Record<string, "CASH" | "CARD" | "BANK_TRANSFER" | "INSTAPAY"> = {
  InstaPay: "INSTAPAY",
  Visa: "CARD",
  Cash: "CASH",
};

const ATT_STATUS: Record<Exclude<AttState, "none">, "ATTENDED" | "MISSED" | "NO_SHOW"> = {
  present: "ATTENDED",
  late: "ATTENDED",
  absent: "MISSED",
  noshow: "NO_SHOW",
};

// ─────────────────────────────────────────────────────────────────────────
//  OpsProvider — ports the prototype's DCLogic class to a React context.
//  All screens/modals read the computed `vals` object via useOps().
//  Mock data lives in lib/data.ts. Replace the array reads / action bodies
//  marked `// TODO(api)` with real fetch/mutation calls when wiring a backend.
// ─────────────────────────────────────────────────────────────────────────

type Dict<T = any> = Record<string, T>;

interface OpsState {
  data: OpsData;
  self: OpsSelf | null;
  live: boolean;
  resolvedChangeIds: string[];
  role: "admin" | "coach";
  view: string;
  coachView: string;
  selSession: string;
  att: Dict<Dict<AttState>>;
  cashOutOpen: boolean;
  coCat: string; coMethod: string; coWho: string; coAmount: string;
  profileName: string | null;
  intakeOpen: boolean; inKind: string; inCat: string; inSource: string; inHasInjury: boolean; inName: string; inPhone: string;
  cmdOpen: boolean; cmdQuery: string;
  clientSeg: string; setTab: string; notifFilter: string;
  authed: boolean; loginRole: string; loginEmail: string; loginPassword: string; loginError: string;
  coachEditOpen: boolean; editCoachId: string | null; ceCats: string[]; ceActive: boolean; ceName: string; ceRole: string;
  toasts: Toast[];
  userClients: any[]; userLeads: any[]; userCashOuts: any[]; userGroups: any[]; userCoaches: any[]; userPlans: any[];
  clientSearch: string; coachSearch: string; leadSearch: string; groupSearch: string;
  deletedClients: string[]; deletedCoaches: string[]; deletedLeads: string[]; deletedGroups: string[]; deletedSubs: string[]; deletedPlans: string[];
  coachEdits: Dict; groupEdits: Dict; subEdits: Dict; clientEdits: Dict; planEdits: Dict;
  confirm: ConfirmReq | null;
  groupEditOpen: boolean; editGroupName: string | null; geName: string; geCoach: string; geCat: string; geDays: string; geTime: string; geMembers: string;
  subMenu: string | null; subEditOpen: boolean; editSubName: string | null; sePlan: string; seAmount: string; seMethod: string;
  clientEditOpen: boolean; editClientName: string | null; clName: string; clPhone: string; clCat: string; clCoach: string; clStatus: string;
  planEditOpen: boolean; editPlanIdx: number | null; peName: string; peDetail: string; pePrice: string;
  leadSort: { key: string; dir: string };
  leadStageFilter: string | null;
  repRange: string;
}

function makeInitialState(initial?: OpsInitial): OpsState {
  const data = initial?.data ?? mockOpsData();
  const selSession =
    data.todaySessions.find((s) => s.state === "live")?.id ??
    data.todaySessions.find((s) => s.state === "upcoming")?.id ??
    data.todaySessions[0]?.id ??
    "";
  return {
    ...baseState,
    data,
    self: initial?.self ?? null,
    live: !!initial,
    authed: !!initial,
    role: initial?.self.role ?? "admin",
    selSession,
    att: data.initialAtt,
  };
}

const baseState: OpsState = {
  data: undefined as unknown as OpsData, // always replaced by makeInitialState
  self: null, live: false, resolvedChangeIds: [],
  role: "admin", view: "today", coachView: "today", selSession: "", att: {},
  cashOutOpen: false, coCat: "Salaries", coMethod: "InstaPay", coWho: "", coAmount: "",
  profileName: null,
  intakeOpen: false, inKind: "client", inCat: "Strength Class", inSource: "WhatsApp", inHasInjury: false, inName: "", inPhone: "",
  cmdOpen: false, cmdQuery: "",
  clientSeg: "All", setTab: "Studio", notifFilter: "All",
  authed: false, loginRole: "admin", loginEmail: "admin@marvelfit.eg", loginPassword: "", loginError: "",
  coachEditOpen: false, editCoachId: null, ceCats: [], ceActive: true, ceName: "", ceRole: "",
  toasts: [],
  userClients: [], userLeads: [], userCashOuts: [], userGroups: [], userCoaches: [], userPlans: [],
  clientSearch: "", coachSearch: "", leadSearch: "", groupSearch: "",
  deletedClients: [], deletedCoaches: [], deletedLeads: [], deletedGroups: [], deletedSubs: [], deletedPlans: [],
  coachEdits: {}, groupEdits: {}, subEdits: {}, clientEdits: {}, planEdits: {},
  confirm: null,
  groupEditOpen: false, editGroupName: null, geName: "", geCoach: "c1", geCat: "Strength", geDays: "", geTime: "", geMembers: "",
  subMenu: null, subEditOpen: false, editSubName: null, sePlan: "Group", seAmount: "", seMethod: "InstaPay",
  clientEditOpen: false, editClientName: null, clName: "", clPhone: "", clCat: "Strength Class", clCoach: "c1", clStatus: "Active",
  planEditOpen: false, editPlanIdx: null, peName: "", peDetail: "", pePrice: "",
  leadSort: { key: "stage", dir: "asc" },
  leadStageFilter: null,
  repRange: "Month",
};

const Ctx = createContext<{ vals: any } | null>(null);

export function OpsProvider({ children, initial }: { children: React.ReactNode; initial?: OpsInitial }) {
  const [state, setStateRaw] = useState<OpsState>(() => makeInitialState(initial));
  const sref = useRef(state); sref.current = state;
  const tid = useRef(0);
  const confirmFn = useRef<null | (() => void)>(null);

  const setState = useCallback((patch: Partial<OpsState> | ((p: OpsState) => Partial<OpsState>)) => {
    setStateRaw((prev) => ({ ...prev, ...(typeof patch === "function" ? patch(prev) : patch) }));
  }, []);

  const pushToast = useCallback((msg: string, kind: "ok" | "warn" = "ok") => {
    const id = "t" + (++tid.current);
    setStateRaw((s) => ({ ...s, toasts: [...s.toasts, { id, msg, kind }] }));
    setTimeout(() => setStateRaw((s) => ({ ...s, toasts: s.toasts.filter((t) => t.id !== id) })), 3000);
  }, []);

  // Fire-and-forget server mutation: the UI stays optimistic, failures toast.
  const api = useCallback((run: () => Promise<unknown>) => {
    if (!sref.current.live) return;
    run().catch((error: unknown) => {
      const message = error instanceof Error ? error.message : "The change could not be saved.";
      pushToast(message, "warn");
    });
  }, [pushToast]);

  // ── attendance ──
  const coachById = useCallback((id: string) => {
    const st = sref.current;
    const base = (st.userCoaches || []).find((c: any) => c.id === id) || st.data.coaches.find((c) => c.id === id);
    if (!base) return { id, name: "—", initials: "?", grad: "#333", role: "", cats: "" } as any;
    const ov = (st.coachEdits || {})[id];
    return ov ? { ...base, ...ov } : base;
  }, []);
  const statusOf = (att: OpsState["att"], sid: string, pid: string): AttState => (att[sid] || {})[pid] || "none";
  const setAtt = useCallback((sid: string, pid: string, target: AttState) => {
    const cleared = statusOf(sref.current.att, sid, pid) === target;
    setStateRaw((prev) => {
      const att = { ...prev.att }; const s = { ...(att[sid] || {}) };
      s[pid] = (s[pid] === target ? "none" : target) as AttState; att[sid] = s; return { ...prev, att };
    });
    api(() => markAttendance(sid, pid, cleared ? "BOOKED" : ATT_STATUS[target as Exclude<AttState, "none">] ?? "BOOKED"));
  }, [api]);
  const markAllPresent = useCallback((sid: string) => {
    const roster = sref.current.data.todaySessions.find((x) => x.id === sid)?.roster || [];
    setStateRaw((prev) => {
      const att = { ...prev.att }; const s = { ...(att[sid] || {}) };
      roster.forEach((p) => { if ((s[p.id] || "none") === "none" || s[p.id] === "present") s[p.id] = "present"; });
      att[sid] = s; return { ...prev, att };
    });
    api(() => markAllAttendance(sid, roster.map((p) => p.id), "ATTENDED"));
    pushToast("Everyone marked present");
  }, [api, pushToast]);

  // ── submits ──
  const submitCashOut = useCallback(() => {
    const s = sref.current;
    const amt = parseInt(String(s.coAmount).replace(/[^0-9]/g, ""), 10);
    if (!amt) { pushToast("Enter an amount first", "warn"); return; }
    const who = (s.coWho || "").trim() || s.coCat;
    const entry = { label: who, cat: s.coCat, amount: "EGP " + amt.toLocaleString("en-US"), method: s.coMethod, date: "Today" };
    api(() => recordStudioExpense({
      amount: amt,
      currency: "EGP",
      category: EXPENSE_CATEGORY[s.coCat] ?? "OTHER",
      paymentMethod: EXPENSE_METHOD[s.coMethod] ?? "CASH",
      description: who,
      occurredAt: new Date().toISOString(),
    }));
    setState((p) => ({ userCashOuts: [entry, ...p.userCashOuts], cashOutOpen: false, coWho: "", coAmount: "" }));
    pushToast("Expense recorded · " + entry.amount);
  }, [api, pushToast, setState]);
  const submitIntake = useCallback(() => {
    const s = sref.current;
    const name = (s.inName || "").trim();
    if (!name) { pushToast("Enter a name first", "warn"); return; }
    const parts = name.split(/\s+/);
    const initials = (((parts[0] || "")[0] || "") + ((parts[1] || "")[0] || "")).toUpperCase() || "?";
    const gradKeys = ["red", "blue", "violet", "amber", "green", "teal"] as const;
    const grad = gradKeys[Math.trunc(Math.random() * gradKeys.length)];
    if (s.inKind === "lead") {
      const row = ["New", name, initials, grad, s.inSource, s.inPhone || "—", s.inCat, "Just added", ""];
      api(() => createAdminLead({
        fullName: name,
        phone: s.inPhone || "—",
        source: s.inSource,
        interestedCategory: domainCategory(s.inCat),
        message: s.inHasInjury ? "Flagged an injury at intake" : undefined,
      }));
      setState((p) => ({ userLeads: [row, ...p.userLeads], intakeOpen: false, inName: "", inPhone: "", inHasInjury: false, view: "leads" }));
      pushToast(name + " added to Leads");
    } else {
      const priv = s.inCat === "PT" || s.inCat === "Rehab";
      const defaultCoach = s.data.coaches[0]?.id ?? "c1";
      const row = [name, initials, grad, s.inCat, priv ? "Private" : "Group", defaultCoach, "Active", s.inPhone || "—", s.inHasInjury ? "Flagged at intake — see notes" : ""];
      api(() => saveAdminClient({
        fullName: name,
        phone: s.inPhone || undefined,
        status: "Active",
        paymentStatus: "Unpaid",
        trainingCategory: domainCategory(s.inCat),
        injuryStatus: s.inHasInjury ? "Current injury" : "None",
        injuryNotes: s.inHasInjury ? "Flagged at intake — see notes" : undefined,
      }));
      setState((p) => ({ userClients: [row, ...p.userClients], intakeOpen: false, inName: "", inPhone: "", inHasInjury: false, view: "clients" }));
      pushToast(name + " added to Clients");
    }
  }, [api, pushToast, setState]);

  // ── deletes ──
  const delClient = useCallback((name: string) => {
    const meta = sref.current.data.clientMeta[name];
    if (meta) api(() => deleteAdminClient({ clientId: meta.clientId, confirmationText: "Delete" }));
    setState((p) => ({ deletedClients: [...p.deletedClients, name], userClients: p.userClients.filter((r) => r[0] !== name), profileName: p.profileName === name ? null : p.profileName }));
    pushToast(name + " removed from clients", "warn");
  }, [api, pushToast, setState]);
  const delLead = useCallback((name: string) => {
    const leadId = sref.current.data.leadIds[name];
    if (leadId) api(() => deleteLeadAction(leadId));
    setState((p) => ({ deletedLeads: [...p.deletedLeads, name], userLeads: p.userLeads.filter((r) => r[1] !== name) }));
    pushToast(name + " removed from pipeline", "warn");
  }, [api, pushToast, setState]);
  const delCoach = useCallback((id: string, name: string) => {
    if (sref.current.data.coaches.some((c) => c.id === id)) api(() => deleteCoachAction({ coachId: id, confirmationText: "Delete" }));
    setState((p) => ({ deletedCoaches: [...p.deletedCoaches, id] }));
    pushToast(name + " removed from team", "warn");
  }, [api, pushToast, setState]);
  const delGroup = useCallback((name: string) => {
    const groupId = sref.current.data.groupIds[name];
    if (groupId) api(() => deleteAdminGroup({ groupId, confirmationText: "Delete" }));
    setState((p) => ({ deletedGroups: [...p.deletedGroups, name], userGroups: p.userGroups.filter((r) => r[0] !== name) }));
    pushToast(name + " removed", "warn");
  }, [api, pushToast, setState]);
  const delSub = useCallback((name: string) => { setState((p) => ({ deletedSubs: [...p.deletedSubs, name], subMenu: null })); pushToast(name + " removed from members", "warn"); }, [pushToast, setState]);
  const delPlan = useCallback((name: string) => { setState((p) => ({ deletedPlans: [...p.deletedPlans, name], planEditOpen: false })); pushToast(name + " removed", "warn"); }, [pushToast, setState]);

  // ── confirm ──
  const askConfirm = useCallback((title: string, body: string, fn: () => void) => { confirmFn.current = fn; setState({ confirm: { title, body } }); }, [setState]);
  const doConfirm = useCallback(() => { const fn = confirmFn.current; confirmFn.current = null; setState({ confirm: null }); fn?.(); }, [setState]);
  const closeConfirm = useCallback(() => { confirmFn.current = null; setState({ confirm: null }); }, [setState]);

  // ── coaches CRUD ──
  const openCoachEdit = useCallback((c: any) => setState({ coachEditOpen: true, editCoachId: c.id, ceName: c.name || "", ceRole: c.role || "", ceCats: (c.cats || "").split(" · ").map((x: string) => x.trim()).filter(Boolean), ceActive: c.active !== false }), [setState]);
  const toggleCeCat = useCallback((cat: string) => setState((p) => ({ ceCats: p.ceCats.includes(cat) ? p.ceCats.filter((x) => x !== cat) : [...p.ceCats, cat] })), [setState]);
  const addCoach = useCallback(() => setState({ coachEditOpen: true, editCoachId: null, ceName: "", ceRole: "", ceCats: [], ceActive: true }), [setState]);
  const saveCoach = useCallback(() => {
    const s = sref.current; const name = (s.ceName || "").trim();
    if (!name) { pushToast("Enter a name first", "warn"); return; }
    const parts = name.split(/\s+/); const initials = (((parts[0] || "")[0] || "") + ((parts[1] || "")[0] || "")).toUpperCase() || "?";
    const cats = (s.ceCats || []).join(" · "); const role = (s.ceRole || "").trim() || "Coach"; const id = s.editCoachId;
    const qualifiedCategoryIds = (s.ceCats || []).map((category) => s.data.categoryIds[category]).filter(Boolean);
    if (id) {
      const email = s.data.coachEmails[id];
      if (email) api(() => saveCoachAction({ coachId: id, fullName: name, email, qualifiedCategoryIds }));
      setState((p) => ({ coachEdits: { ...p.coachEdits, [id]: { name, initials, role, cats, active: p.ceActive } }, coachEditOpen: false })); pushToast(name + " updated");
    } else {
      const nid = "u" + ((s.userCoaches || []).length + 1);
      const gk = ["red", "blue", "violet", "amber", "green", "teal"] as const; const grad = D.GRADS[gk[Math.trunc(Math.random() * gk.length)]];
      const email = name.toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/^\.+|\.+$/g, "") + "@marvelfit.local";
      if (sref.current.live) {
        api(async () => {
          const result = await saveCoachAction({ fullName: name, email, qualifiedCategoryIds });
          if (result.credentials) {
            pushToast(`Sign-in for ${name}: ${result.credentials.signInId} / ${result.credentials.temporaryPassword}`);
          }
        });
      }
      setState((p) => ({ userCoaches: [{ id: nid, name, initials, role, cats, grad, active: p.ceActive }, ...(p.userCoaches || [])], coachEditOpen: false }));
      pushToast(name + " added to team");
    }
  }, [api, pushToast, setState]);

  // ── groups CRUD ──
  const openGroupEdit = useCallback((g: any) => setState({ groupEditOpen: true, editGroupName: g.name, geName: g.name, geCoach: g.coachId, geCat: g.category, geDays: g.days, geTime: g.time, geMembers: String(g.members) }), [setState]);
  const addGroup = useCallback(() => setState({ groupEditOpen: true, editGroupName: null, geName: "", geCoach: "c1", geCat: "General", geDays: "", geTime: "", geMembers: "" }), [setState]);
  const saveGroup = useCallback(() => {
    const s = sref.current; const name = (s.geName || "").trim();
    if (!name) { pushToast("Enter a group name", "warn"); return; }
    const row = { name, coachId: s.geCoach, days: (s.geDays || "").trim() || "Set schedule", time: (s.geTime || "").trim() || "—", category: (s.geCat || "").trim() || "General", members: 0 };
    const groupId = s.editGroupName ? s.data.groupIds[s.editGroupName] : null;
    api(() => saveAdminGroup({
      groupId: groupId ?? undefined,
      name,
      groupType: "Group",
      categoryId: s.data.categoryIds[row.category] ?? "",
      coachId: row.coachId,
      isActive: true,
    }));
    if (s.editGroupName) { const orig = s.editGroupName; setState((p) => ({ groupEdits: { ...p.groupEdits, [orig]: row }, groupEditOpen: false })); pushToast(name + " updated"); }
    else { setState((p) => ({ userGroups: [[row.name, row.coachId, row.days, row.time, row.category, row.members], ...p.userGroups], groupEditOpen: false, view: "groups" })); pushToast(name + " created"); }
  }, [api, pushToast, setState]);

  // ── subs CRUD ──
  const toggleSubMenu = useCallback((name: string) => setState((p) => ({ subMenu: p.subMenu === name ? null : name })), [setState]);
  const cancelSub = useCallback((name: string) => {
    const meta = sref.current.data.subMeta[name];
    if (meta) api(() => mutateAdminSubscriptionLifecycle(meta.subscriptionId, "cancel"));
    setState((p) => ({ subEdits: { ...p.subEdits, [name]: { ...(p.subEdits[name] || {}), status: "Cancelled" } }, subMenu: null })); pushToast(name + "’s subscription cancelled", "warn");
  }, [api, pushToast, setState]);
  const subLifecycle = useCallback((name: string, action: "renew" | "resume", method: string, amount: number) => {
    const meta = sref.current.data.subMeta[name];
    if (!meta) return;
    const paymentMethod = (["InstaPay", "Visa", "Cash"].includes(method) ? method : "Cash") as "InstaPay" | "Visa" | "Cash";
    api(() => mutateAdminSubscriptionLifecycle(
      meta.subscriptionId,
      action,
      action === "renew" ? paymentMethod : undefined,
      action === "renew" ? { amount: String(amount || 0), sessionsPerMonth: 12, durationMonths: 1 } : undefined,
    ));
    setState((p) => ({ subEdits: { ...p.subEdits, [name]: { ...(p.subEdits[name] || {}), status: action === "renew" ? "Renewed" : "Active" } } }));
  }, [api, setState]);
  const openSubEdit = useCallback((sub: any) => setState({ subEditOpen: true, editSubName: sub.name, sePlan: sub.plan, seAmount: String(sub.rawAmount), seMethod: sub.method, subMenu: null }), [setState]);
  const saveSubEdit = useCallback(() => {
    const s = sref.current; const name = s.editSubName!; const amt = parseInt(String(s.seAmount).replace(/[^0-9]/g, ""), 10) || 0;
    const meta = s.data.subMeta[name];
    if (meta && amt) {
      api(() => saveAdminSubscription({
        subscriptionId: meta.subscriptionId,
        clientId: meta.clientId,
        planId: meta.planId,
        amount: String(amt),
        renewalDate: meta.renewalDate,
        subscriptionStatus: meta.subscriptionStatus,
        paymentStatus: meta.paymentStatus,
      } as Parameters<typeof saveAdminSubscription>[0]));
    }
    setState((p) => ({ subEdits: { ...p.subEdits, [name]: { ...(p.subEdits[name] || {}), plan: p.sePlan, amount: amt, method: p.seMethod } }, subEditOpen: false }));
    pushToast(name + "’s plan updated");
  }, [api, pushToast, setState]);

  // ── clients CRUD ──
  const openClientEdit = useCallback((cl: any) => setState({ clientEditOpen: true, editClientName: cl.name, clName: cl.name, clPhone: cl.phone, clCat: cl.category, clCoach: cl.coachId, clStatus: cl.status }), [setState]);
  const saveClientEdit = useCallback(() => {
    const s = sref.current; const name = s.editClientName!;
    const meta = s.data.clientMeta[name];
    if (meta) {
      api(() => saveAdminClient({
        clientId: meta.clientId,
        fullName: name,
        email: meta.email || undefined,
        phone: s.clPhone || undefined,
        status: s.clStatus,
        paymentStatus: meta.paymentStatus,
        groupId: meta.groupId ?? undefined,
        trainingCategory: domainCategory(s.clCat),
      }));
    }
    setState((p) => ({ clientEdits: { ...p.clientEdits, [name]: { category: p.clCat, coachId: p.clCoach, status: p.clStatus, phone: p.clPhone } }, clientEditOpen: false }));
    pushToast(name + " updated");
  }, [api, pushToast, setState]);

  // ── plans CRUD ──
  const addPlan = useCallback(() => setState({ planEditOpen: true, editPlanIdx: null, peName: "", peDetail: "", pePrice: "" }), [setState]);
  const openPlanEdit = useCallback((idx: number, p: any) => setState({ planEditOpen: true, editPlanIdx: idx, peName: p.name, peDetail: p.detail, pePrice: String(p.price).replace(/[^0-9]/g, "") }), [setState]);
  const savePlan = useCallback(() => {
    const s = sref.current; const name = (s.peName || "").trim();
    if (!name) { pushToast("Enter a plan name", "warn"); return; }
    const amt = parseInt(String(s.pePrice).replace(/[^0-9]/g, ""), 10) || 0;
    const row = { name, detail: (s.peDetail || "").trim(), price: "EGP " + amt.toLocaleString("en-US") };
    // TODO(api): create/update plan
    if (s.editPlanIdx != null) { const idx = s.editPlanIdx; setState((p) => ({ planEdits: { ...p.planEdits, [idx]: row }, planEditOpen: false })); pushToast(name + " updated"); }
    else { setState((p) => ({ userPlans: [row, ...p.userPlans], planEditOpen: false })); pushToast(name + " added"); }
  }, [pushToast, setState]);

  const setLeadSort = useCallback((key: string) => setState((p) => { const cur = p.leadSort || { key: "stage", dir: "asc" }; return { leadSort: cur.key === key ? { key, dir: cur.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" } }; }), [setState]);

  // ── live-only actions ──
  const decideChange = useCallback((id: string | null, decision: "APPROVED" | "DECLINED", name: string) => {
    if (id) {
      api(() => decideScheduleChangeRequest(id, decision));
      setState((p) => ({ resolvedChangeIds: [...p.resolvedChangeIds, id] }));
    }
    pushToast(decision === "APPROVED" ? "Approved — " + name + "’s change applied" : name + "’s request declined", decision === "APPROVED" ? "ok" : "warn");
  }, [api, pushToast, setState]);
  const subscribeTrial = useCallback((leadId: string | null, name: string) => {
    if (leadId) api(() => approveLeadAsClient(leadId));
    pushToast(name + " subscribed — welcome aboard");
  }, [api, pushToast]);
  const markAllRead = useCallback(() => {
    api(() => markAllNotificationsRead());
    pushToast("All notifications marked read");
  }, [api, pushToast]);
  const doSignOut = useCallback(() => {
    if (sref.current.live) { void nextAuthSignOut({ redirectTo: "/login" }); return; }
    setState({ authed: false, loginPassword: "", loginError: "" });
  }, [setState]);

  // keyboard: "/" opens command palette
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = /^(input|textarea)$/i.test((e.target as HTMLElement)?.tagName || "");
      if (e.key === "/" && !typing && !sref.current.cmdOpen) { e.preventDefault(); setState({ cmdOpen: true }); }
      else if (e.key === "Escape" && sref.current.cmdOpen) setState({ cmdOpen: false });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setState]);

  const act = {
    setState, pushToast, coachById, statusOf, setAtt, markAllPresent, submitCashOut, submitIntake,
    delClient, delLead, delCoach, delGroup, delSub, delPlan, askConfirm, doConfirm, closeConfirm,
    openCoachEdit, toggleCeCat, addCoach, saveCoach, openGroupEdit, addGroup, saveGroup,
    toggleSubMenu, cancelSub, openSubEdit, saveSubEdit, openClientEdit, saveClientEdit,
    addPlan, openPlanEdit, savePlan, setLeadSort,
    subLifecycle, decideChange, subscribeTrial, markAllRead, doSignOut,
  };

  const vals = useMemo(() => computeVals(state, act), [state]); // eslint-disable-line react-hooks/exhaustive-deps

  return <Ctx.Provider value={{ vals }}>{children}</Ctx.Provider>;
}

export function useOps() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useOps must be used within OpsProvider");
  return ctx.vals;
}

// ─────────────────────────────────────────────────────────────────────────
//  computeVals — 1:1 port of DCLogic.renderVals(). Returns the object every
//  screen/modal reads. Style strings are applied via lib/css.ts `css()`.
// ─────────────────────────────────────────────────────────────────────────
function computeVals(state: OpsState, act: any) {
  const { coachById } = act;
  const data = state.data;
  const view = state.view;
  const isAdmin = state.role === "admin";
  const isCoach = state.role === "coach";
  const myId = state.self?.coachId ?? data.coaches[0]?.id ?? "";
  const self = state.self && state.self.role === "coach"
    ? { id: myId, name: state.self.name, initials: state.self.initials, role: state.self.title, grad: D.g("red"), cats: "" }
    : coachById(myId);

  const titles: Dict<[string, string]> = { today: ["Operations", "Today"], attendance: ["Operations", "Attendance"], schedule: ["Operations", "Schedule"], leads: ["People", "Leads & Trials"], clients: ["People", "Clients"], groups: ["People", "Groups"], coaches: ["People", "Coaches"], subs: ["Money", "Subscriptions"], reports: ["Insights", "Reports"], notifications: ["System", "Notifications"], settings: ["System", "Settings"] };
  const coachTitles: Dict<[string, string]> = { today: ["Coach", "Today's sessions"], phone: ["Coach", "On my phone"], alerts: ["Coach", "Notifications"] };
  const t = isCoach ? (coachTitles[state.coachView] || coachTitles.today) : (titles[view] || titles.today);

  const nav = (to: string) => () => act.setState({ view: to });
  const navStyle = (id: string) => state.view === id ? "border-left-color:var(--red); background:linear-gradient(90deg,rgba(230,36,41,.14),transparent); color:#fff;" : "color:var(--muted2);";
  const coachNavStyle = (id: string) => state.coachView === id ? "border-left-color:var(--red); background:linear-gradient(90deg,rgba(230,36,41,.14),transparent); color:#fff;" : "color:var(--muted2);";

  const presentCount = (sid: string) => {
    const roster = data.todaySessions.find((x) => x.id === sid)?.roster || [];
    const a = state.att[sid] || {};
    return roster.filter((p) => ["present", "late"].includes(a[p.id] || "none")).length;
  };
  const countState = (sid: string, st: string) => {
    const roster = data.todaySessions.find((x) => x.id === sid)?.roster || [];
    const a = state.att[sid] || {};
    return roster.filter((p) => (a[p.id] || "none") === st).length;
  };

  const tSessions = data.todaySessions.map((s) => {
    const c = coachById(s.coachId); const present = presentCount(s.id); const total = s.roster.length;
    const pct = total ? Math.round(present / total * 100) : 0;
    return {
      time: s.time, dur: s.dur, category: s.category, type: s.type, coach: c.name, coachInitials: c.initials, coachGrad: c.grad, location: s.location,
      present, total, pct: pct + "%", isLive: s.state === "live",
      typeStyle: s.type === "Private" ? "color:var(--violet); border-color:rgba(139,92,246,.4);" : "",
      rowStyle: s.state === "live" ? "background:linear-gradient(90deg,rgba(230,36,41,.06),transparent); border-left:3px solid var(--red); padding-left:19px;" : (s.state === "done" ? "opacity:.62;" : ""),
      open: () => act.setState({ view: "attendance", selSession: s.id }),
    };
  });
  const liveSession = data.todaySessions.find((s) => s.state === "live");

  const trials = data.trialsToday.map((tr) => ({
    name: tr.name, initials: tr.initials, grad: D.g(tr.gradKey), time: tr.time, category: tr.category, type: tr.type, source: tr.source,
    sourceStyle: D.srcStyle(tr.source) || "background:var(--surface3); border:1px solid var(--line2); color:var(--muted2);",
    subscribe: () => act.subscribeTrial(tr.leadId, tr.name),
    followUp: () => act.pushToast("Follow-up reminder set — " + tr.name),
  }));

  const renewSoon = data.renewSoon.map((r) => ({
    name: r.name, initials: r.initials, grad: D.g(r.gradKey), plan: r.plan, amount: r.amount, method: r.method, due: r.due,
    dueColor: r.days <= 2 ? "var(--danger)" : r.days <= 5 ? "var(--warn)" : "var(--muted2)",
    remind: () => act.pushToast("Renewal reminder sent to " + r.name),
  }));

  const coachNow = data.coaches.map((c) => { const s = data.coachStatus[c.id] || { now: "—", status: "Off today", k: "off" }; return { name: c.name, role: c.role, initials: c.initials, grad: c.grad, now: s.now, status: s.status, statusStyle: D.coachStatusStyle(s.k) }; });

  const methodColors = ["linear-gradient(90deg,#e62429,#ff4f54)", "linear-gradient(90deg,#3b82f6,#8b5cf6)", "linear-gradient(90deg,#25d366,#14b8a6)", "linear-gradient(90deg,#f59e0b,#ef4444)"];
  const methodsToday = data.methodsToday.map((m, i) => ({ ...m, color: methodColors[i % methodColors.length] }));

  // ── attendance selected ──
  const emptySession = { id: "", time: "—", dur: "", category: "No sessions today", type: "Group" as const, coachId: "", location: "", state: "upcoming" as const, roster: [] };
  const sel = data.todaySessions.find((s) => s.id === state.selSession) || data.todaySessions[0] || emptySession;
  const selCoach = coachById(sel.coachId);
  const checkVis = (st: string) => {
    if (st === "present") return { glyph: "✓", style: "background:linear-gradient(135deg,#059669,#25d366); color:#04240f; border:1px solid transparent;" };
    if (st === "late") return { glyph: "L", style: "background:rgba(245,158,11,.18); color:var(--warn); border:1px solid rgba(245,158,11,.5);" };
    if (st === "absent") return { glyph: "✕", style: "background:rgba(239,68,68,.14); color:var(--danger); border:1px solid rgba(239,68,68,.45);" };
    if (st === "noshow") return { glyph: "N", style: "background:rgba(239,68,68,.08); color:var(--danger); border:1px solid rgba(239,68,68,.3);" };
    return { glyph: "", style: "background:var(--surface3); color:var(--muted); border:1px dashed var(--line3);" };
  };
  const btnStyle = (active: boolean, tone: string) => {
    const tones: Dict<string> = { absent: "var(--danger)", late: "var(--warn)", noshow: "var(--danger)" };
    return active ? `background:${tones[tone]}; color:#fff; border:0;` : "background:transparent; color:var(--muted); border:1px solid var(--line2);";
  };
  const selRoster = sel.roster.map((p) => {
    const st = act.statusOf(state.att, sel.id, p.id); const cv = checkVis(st);
    return {
      name: p.name, meta: p.meta, hasInjury: !!p.injury, injury: p.injury, isTrial: p.isTrial,
      checkGlyph: cv.glyph, checkStyle: cv.style,
      rowStyle: st === "present" || st === "late" ? "background:rgba(37,211,102,.04);" : (st === "absent" || st === "noshow" ? "opacity:.6;" : ""),
      absentStyle: btnStyle(st === "absent", "absent"), lateStyle: btnStyle(st === "late", "late"),
      tap: () => act.setAtt(sel.id, p.id, "present"),
      setAbsent: (e: any) => { e.stopPropagation(); act.setAtt(sel.id, p.id, "absent"); },
      setLate: (e: any) => { e.stopPropagation(); act.setAtt(sel.id, p.id, "late"); },
      stop: (e: any) => e.stopPropagation(),
    };
  });
  const sessionChips = data.todaySessions.map((s) => ({
    time: s.time, category: s.category, present: presentCount(s.id), total: s.roster.length,
    chipStyle: s.id === sel.id ? "background:linear-gradient(135deg,rgba(230,36,41,.16),rgba(230,36,41,.04)); border:1px solid rgba(230,36,41,.5); color:#fff;" : "background:var(--surface); border:1px solid var(--line); color:var(--muted2);",
    select: () => act.setState({ selSession: s.id }),
  }));

  // ── schedule ──
  const schedGrid = data.schedRows.map((row) => ({
    time: row.time,
    cells: row.cells.map((cell) => {
      if (!cell) return { notEmpty: false, style: "", cat: "", coach: "", isLive: false };
      const c = coachById(cell.coach); const col = D.SCHED_CAT_COLOR[cell.cat] || "#666";
      return { notEmpty: true, cat: cell.cat, coach: c.name.split(" ")[0], initials: c.initials, coachGrad: c.grad, isLive: !!cell.live, isPriv: !!cell.priv, style: `height:100%; background:${cell.today ? "rgba(230,36,41,.07)" : "var(--surface2)"}; border-left:3px solid ${col};` };
    }),
  }));
  const scheduleChanges = data.scheduleChanges
    .filter((ch) => !ch.id || !state.resolvedChangeIds.includes(ch.id))
    .map((ch) => ({
      name: ch.name, initials: ch.initials, grad: D.g(ch.gradKey), kind: ch.kind, kindStyle: D.kindStyle(ch.kind), detail: ch.detail, reason: ch.reason,
      approve: () => act.decideChange(ch.id, "APPROVED", ch.name),
      decline: () => act.decideChange(ch.id, "DECLINED", ch.name),
    }));

  // ── coaches ──
  const deletedCoaches = state.deletedCoaches || [];
  const coSearch = (state.coachSearch || "").trim().toLowerCase();
  const allCoachIds = [...(state.userCoaches || []).map((c: any) => c.id), ...data.coaches.map((c) => c.id)];
  const coachCards = allCoachIds.filter((id) => !deletedCoaches.includes(id)).map((id) => coachById(id)).filter((c: any) => !coSearch || (c.name + " " + c.role + " " + c.cats).toLowerCase().includes(coSearch)).map((c: any) => {
    const s = data.coachSlots[c.id] || { blocks: [], today: "New — set schedule", week: 0, clients: 0 };
    const load = Math.min(100, Math.round(s.week / 16 * 100));
    return {
      name: c.name, role: c.role, initials: c.initials, grad: c.grad, cats: c.cats, today: s.today, week: s.week, clients: s.clients,
      loadPct: load + "%", loadColor: load > 80 ? "var(--danger)" : load > 55 ? "var(--warn)" : "var(--success)",
      timeline: (s.blocks || []).map((b) => ({ h: b[0], busy: b[1] > 0, style: b[1] > 0 ? "background:linear-gradient(180deg,var(--red),var(--red-deep));" : "background:var(--surface3);" })),
      edit: () => act.openCoachEdit(c), del: (e: any) => { e?.stopPropagation?.(); act.askConfirm("Remove " + c.name + "?", "They will be taken off the team and unassigned from groups.", () => act.delCoach(c.id, c.name)); },
    };
  });
  const ceEditing = state.editCoachId ? coachById(state.editCoachId) : null;
  const ceCatOpts = Object.keys(data.categoryIds);
  const ceCatChips = ceCatOpts.map((c) => ({ label: c, style: (state.ceCats || []).includes(c) ? "background:var(--red); color:#fff; border-color:var(--red);" : "background:transparent; color:var(--muted2); border-color:var(--line2);", pick: () => act.toggleCeCat(c) }));

  // ── subscriptions ──
  const deletedSubs = state.deletedSubs || []; const subEdits = state.subEdits || {}; const subMenu = state.subMenu;
  const subs = data.subsRaw.filter((r) => !deletedSubs.includes(r[0])).map((r) => {
    const ov = subEdits[r[0]] || {};
    const plan = ov.plan != null ? ov.plan : r[3], rawAmount = ov.amount != null ? ov.amount : r[4], method = ov.method != null ? ov.method : r[5], status = ov.status != null ? ov.status : r[6];
    const bundle = r[9], used = r[10], remaining = Math.max(0, bundle - used); const rpct = Math.round(remaining / bundle * 100);
    const rowSelf = { name: r[0], plan, rawAmount, method };
    return {
      name: r[0], initials: r[1], grad: D.g(r[2]), plan, rawAmount, amount: D.fmtEGP(rawAmount), method, methodStyle: D.methodBadge(method), status, statusStyle: D.subStatusPill(status), expiry: r[7], due: r[8],
      bundle, remaining, remLabel: remaining + "/" + bundle, remPct: rpct + "%",
      remColor: remaining === 0 ? "var(--danger)" : (remaining <= 2 ? "var(--warn)" : "var(--success)"),
      dueColor: status === "Expired" ? "var(--danger)" : (status === "Expiring" ? "var(--warn)" : "var(--muted2)"),
      cta: status === "Renewed" ? "Receipt" : (status === "Expired" ? "Reactivate" : (status === "Cancelled" ? "Resume" : "Renew")),
      ctaAct: () => {
        if (status === "Renewed") { act.pushToast("Receipt sent to " + r[0]); return; }
        if (status === "Cancelled") { act.subLifecycle(r[0], "resume", method, rawAmount); act.pushToast(r[0] + " resumed"); return; }
        act.subLifecycle(r[0], "renew", method, rawAmount);
        act.pushToast(r[0] + " renewed · " + D.fmtEGP(rawAmount));
      },
      menuOpen: subMenu === r[0], toggleMenu: (e: any) => { e?.stopPropagation?.(); act.toggleSubMenu(r[0]); },
      edit: (e: any) => { e?.stopPropagation?.(); act.openSubEdit(rowSelf); },
      cancel: (e: any) => { e?.stopPropagation?.(); act.cancelSub(r[0]); },
      del: (e: any) => { e?.stopPropagation?.(); act.setState({ subMenu: null }); act.askConfirm("Remove " + r[0] + "?", "This deletes their subscription record permanently.", () => act.delSub(r[0])); },
    };
  });
  const subTiles = [
    { label: "Active", value: subs.filter((s) => s.status === "Active").length, color: "var(--success)", sub: "On track" },
    { label: "Expiring (7d)", value: subs.filter((s) => s.status === "Expiring").length, color: "var(--warn)", sub: "Chase renewals" },
    { label: "Expired", value: subs.filter((s) => s.status === "Expired").length, color: "var(--danger)", sub: "Win back" },
    { label: "Renewed (Feb)", value: subs.filter((s) => s.status === "Renewed").length, color: "var(--blue)", sub: "This month" },
  ];
  const cashLedger = data.cashRows.filter((r) => r[0] === "in").map((r) => ({ inbound: true, label: r[1], method: r[2], amount: r[3], time: r[4], icon: "↓", iconStyle: "background:rgba(37,211,102,.14); color:var(--success);", amountColor: "var(--success)" }));

  // ── leads (pipeline + list) ──
  const leadsRaw = [...state.userLeads, ...data.leadsRaw];
  const deletedLeads = state.deletedLeads || [];
  const leadSearch = (state.leadSearch || "").trim().toLowerCase();
  const leadsView = leadsRaw.filter((l) => !deletedLeads.includes(l[1]) && (!leadSearch || (l[1] + " " + l[4] + " " + l[6] + " " + l[7]).toLowerCase().includes(leadSearch)));
  const leadCols = D.STAGES.map((st, si) => ({
    stage: st, accent: D.STAGE_META[st], stageNum: "0" + (si + 1), barStyle: "background:" + D.STAGE_META[st] + ";",
    count: leadsView.filter((l) => l[0] === st).length,
    countPill: "background:" + D.STAGE_PILL_BG[st] + "; color:" + D.STAGE_META[st] + ";",
    action: D.leadAction(st), hasAction: !!D.leadAction(st), actionStyle: D.leadActionStyle(st),
    act: D.leadAction(st) ? () => act.pushToast(({ New: "Lead assigned to a group", "Trial booked": "Trial marked done", "Trial done": "Lead subscribed — welcome aboard" } as Dict)[st]) : null,
    isEmpty: leadsView.filter((l) => l[0] === st).length === 0,
    leads: leadsView.filter((l) => l[0] === st).map((l) => ({ name: l[1], initials: l[2], grad: D.g(l[3]), source: l[4], sourceStyle: D.srcStyle(l[4]), phone: l[5], wants: l[6], note: l[7], assigned: l[8], hasAssigned: !!l[8], catDot: "background:" + (D.LEAD_CAT_COLOR[l[6]] || "var(--muted)") + ";", del: (e: any) => { e?.stopPropagation?.(); act.delLead(l[1]); }, isWon: st === "Won", isLost: st === "Lost", cardStyle: st === "Lost" ? "opacity:.6;" : "", hasInjury: !!data.injuryByLead[l[1]], injury: data.injuryByLead[l[1]] || "" })),
  }));
  const leadSources = [
    { label: "WhatsApp", count: leadsView.filter((l) => l[4] === "WhatsApp").length, color: "var(--success)" },
    { label: "Instagram", count: leadsView.filter((l) => l[4] === "Instagram").length, color: "#ec4899" },
    { label: "Call", count: leadsView.filter((l) => l[4] === "Call").length, color: "var(--blue)" },
    { label: "On-ground", count: leadsView.filter((l) => l[4] === "On-ground").length, color: "var(--warn)" },
  ];
  const leadSort = state.leadSort || { key: "stage", dir: "asc" };
  const leadStageFilter = state.leadStageFilter || null;
  const lcmp = (a: any, b: any) => {
    let av: any, bv: any;
    if (leadSort.key === "name") { av = a[1].toLowerCase(); bv = b[1].toLowerCase(); }
    else if (leadSort.key === "source") { av = a[4].toLowerCase(); bv = b[4].toLowerCase(); }
    else if (leadSort.key === "wants") { av = a[6].toLowerCase(); bv = b[6].toLowerCase(); }
    else { av = D.STAGES.indexOf(a[0]); bv = D.STAGES.indexOf(b[0]); }
    if (av < bv) return -1; if (av > bv) return 1; return a[1].localeCompare(b[1]);
  };
  const leadFlat = leadsView.filter((l) => !leadStageFilter || l[0] === leadStageFilter).slice().sort((a, b) => leadSort.dir === "asc" ? lcmp(a, b) : -lcmp(a, b));
  const nextStepText = (st: string, as: string) => as || ({ New: "Needs first contact", "Trial booked": "Awaiting trial", "Trial done": "Awaiting decision", Won: "Subscribed", Lost: "Chose elsewhere" } as Dict)[st];
  const leadRows = leadFlat.map((l) => { const st = l[0], as = l[8], today = /today/i.test(as); return {
    name: l[1], initials: l[2], grad: D.g(l[3]), source: l[4], sourceStyle: D.srcStyle(l[4]), phone: l[5], wants: l[6], note: l[7] || "—",
    stage: st, stageColor: D.STAGE_META[st], stagePill: "background:" + D.STAGE_PILL_BG[st] + "; color:" + D.STAGE_META[st] + ";",
    catDot: "background:" + (D.LEAD_CAT_COLOR[l[6]] || "var(--muted)") + ";",
    nextStep: nextStepText(st, as), attention: today, nextColor: today ? "var(--warn)" : (st === "New" ? "var(--red2)" : "var(--muted)"),
    hasInjury: !!data.injuryByLead[l[1]], injury: data.injuryByLead[l[1]] || "",
    hasAction: !!D.leadAction(st), action: D.leadAction(st), actionStyle: D.leadActionStyle(st),
    act: D.leadAction(st) ? () => act.pushToast(({ New: "Lead assigned to a group", "Trial booked": "Trial marked done", "Trial done": "Lead subscribed — welcome aboard" } as Dict)[st]) : null,
    del: (e: any) => { e?.stopPropagation?.(); act.delLead(l[1]); }, rowStyle: st === "Lost" ? "opacity:.6;" : "",
  }; });
  const leadsListEmpty = leadRows.length === 0;
  const leadStrip = D.STAGES.map((st) => { const c = leadsView.filter((l) => l[0] === st).length; const active = leadStageFilter === st; return {
    stage: st, count: c, color: D.STAGE_META[st], labelColor: active ? "#fff" : "var(--muted)", numColor: active ? D.STAGE_META[st] : "#fff", bg: active ? D.STAGE_PILL_BG[st] : "transparent",
    toggle: () => act.setState((s: OpsState) => ({ leadStageFilter: s.leadStageFilter === st ? null : st })),
  }; });
  const leadArr = (key: string) => leadSort.key === key ? (leadSort.dir === "asc" ? " ↑" : " ↓") : "";

  // ── groups ──
  const groupsRaw = [...state.userGroups, ...data.groupsRaw];
  const deletedGroups = state.deletedGroups || []; const groupEdits = state.groupEdits || {};
  const grpSearch = (state.groupSearch || "").trim().toLowerCase();
  const groups = groupsRaw.filter((gr) => !deletedGroups.includes(gr[0])).map((gr) => {
    const orig = gr[0]; const ov = groupEdits[orig];
    const name = ov ? ov.name : gr[0], coachId = ov ? ov.coachId : gr[1], days = ov ? ov.days : gr[2], time = ov ? ov.time : gr[3], category = ov ? ov.category : gr[4], members = ov ? ov.members : gr[5];
    const c = coachById(coachId);
    return { orig, name, coachId, coach: c.name, initials: c.initials, coachGrad: c.grad, days, time, category, members,
      edit: (e: any) => { e?.stopPropagation?.(); act.openGroupEdit({ name, coachId, days, time, category, members }); },
      del: (e: any) => { e?.stopPropagation?.(); act.askConfirm("Delete " + name + "?", "This removes the recurring group. Members are not affected.", () => act.delGroup(orig)); } };
  }).filter((g) => !grpSearch || (g.name + " " + g.category + " " + g.coach).toLowerCase().includes(grpSearch));

  // ── clients ──
  const clientsRaw = [...state.userClients, ...data.clientsRaw];
  const openClient = (name: string) => () => act.setState({ profileName: name });
  const deletedClients = state.deletedClients || []; const clientEdits = state.clientEdits || {};
  const clients = clientsRaw.filter((cl) => !deletedClients.includes(cl[0])).map((cl) => {
    const ov = clientEdits[cl[0]] || {};
    const category = ov.category != null ? ov.category : cl[3], coachId = ov.coachId != null ? ov.coachId : cl[5], status = ov.status != null ? ov.status : cl[6], phone = ov.phone != null ? ov.phone : cl[7];
    const c = coachById(coachId); const pr = data.clientProfiles[cl[0]] || { bundle: 0, used: 0 };
    const rem = Math.max(0, pr.bundle - pr.used); const remColor = rem === 0 ? "var(--danger)" : (rem <= 2 ? "var(--warn)" : "var(--success)");
    return { name: cl[0], initials: cl[1], grad: D.g(cl[2]), category, type: cl[4], coachId, coach: c.name, coachInitials: c.initials, coachGrad: c.grad,
      status, statusStyle: D.clStatusPill(status), phone, injury: cl[8], hasInjury: !!cl[8], open: openClient(cl[0]),
      edit: (e: any) => { e?.stopPropagation?.(); act.openClientEdit({ name: cl[0], phone, category, coachId, status }); },
      del: (e: any) => { e?.stopPropagation?.(); act.askConfirm("Remove " + cl[0] + "?", "This removes the client from your roster.", () => act.delClient(cl[0])); },
      rem, remLabel: pr.bundle ? rem + " of " + pr.bundle : "—", remPct: (pr.bundle ? Math.round(rem / pr.bundle * 100) : 0) + "%", remColor };
  });
  const clSeg = state.clientSeg; const clSearch = (state.clientSearch || "").trim().toLowerCase();
  const clSegMatch = (c: any, seg: string) => seg === "All" ? true : seg === "Injuries" ? c.hasInjury : c.status === seg;
  const clSearchMatch = (c: any) => !clSearch || (c.name + " " + c.category + " " + c.coach + " " + c.phone).toLowerCase().includes(clSearch);
  const clientsFiltered = clients.filter((c) => clSegMatch(c, clSeg) && clSearchMatch(c));
  const clSegDef = [{ label: "All", key: "All" }, { label: "Active", key: "Active" }, { label: "Trial", key: "Trial" }, { label: "Paused", key: "Paused" }, { label: "Inactive", key: "Inactive" }, { label: "Injuries", key: "Injuries" }];
  const clientSegs = clSegDef.map((s) => ({ label: s.label, count: clients.filter((c) => clSegMatch(c, s.key)).length, pick: () => act.setState({ clientSeg: s.key }), style: s.key === clSeg ? "background:var(--red); color:#fff; border-color:var(--red);" : "background:transparent; color:var(--muted2); border-color:var(--line2);" }));
  const clientTiles = [
    { label: "Total clients", value: clients.length, color: "", border: "border-right:1px solid var(--line);" },
    { label: "Active", value: clients.filter((c) => c.status === "Active").length, color: "color:var(--success);", border: "border-right:1px solid var(--line);" },
    { label: "On trial", value: clients.filter((c) => c.status === "Trial").length, color: "color:var(--red2);", border: "border-right:1px solid var(--line);" },
    { label: "Injuries to watch", value: clients.filter((c) => c.hasInjury).length, color: "color:var(--warn);", border: "" },
  ];

  // ── profile drawer ──
  const pName = state.profileName;
  const pClientRaw = pName ? clientsRaw.find((c) => c[0] === pName) : null;
  const prof = pName ? (data.clientProfiles[pName] || (pClientRaw ? { joined: "Just now", plan: pClientRaw[6] === "Trial" ? "Trial" : "New — plan pending", bundle: 0, used: 0, streak: 0, attRate: 0, days: pClientRaw[3], injuryHist: pClientRaw[8] ? [pClientRaw[8]] : [], history: ["Added via intake just now"] } : null)) : null;
  let profile: any = null;
  if (pClientRaw && prof) {
    const pc = coachById(pClientRaw[5]); const remaining = Math.max(0, prof.bundle - prof.used);
    profile = {
      name: pClientRaw[0], initials: pClientRaw[1], grad: D.g(pClientRaw[2]), category: pClientRaw[3], type: pClientRaw[4], status: pClientRaw[6], statusStyle: D.clStatusPill(pClientRaw[6]),
      phone: pClientRaw[7], coach: pc.name, coachInitials: pc.initials, coachGrad: pc.grad, joined: prof.joined, plan: prof.plan, days: prof.days,
      bundle: prof.bundle, remaining, remLabel: remaining + " of " + prof.bundle, remPct: (prof.bundle ? Math.round(remaining / prof.bundle * 100) : 0) + "%",
      remColor: remaining === 0 ? "var(--danger)" : (remaining <= 2 ? "var(--warn)" : "var(--success)"), streak: prof.streak, attRate: prof.attRate + "%",
      hasInjury: prof.injuryHist.length > 0, injuryHist: prof.injuryHist,
      history: prof.history.map((h: string, i: number) => ({ text: h, first: i === 0, dotStyle: i === 0 ? "background:var(--red);" : "background:var(--line3);" })),
      renew: () => act.pushToast(pClientRaw[0] + " renewed — receipt sent"), whatsapp: () => act.pushToast("WhatsApp opened for " + pClientRaw[0]),
      changeSchedule: () => act.pushToast("Schedule change drafted for " + pClientRaw[0]),
      editClient: () => { const ov = (state.clientEdits || {})[pClientRaw[0]] || {}; act.openClientEdit({ name: pClientRaw[0], phone: ov.phone != null ? ov.phone : pClientRaw[7], category: ov.category != null ? ov.category : pClientRaw[3], coachId: ov.coachId != null ? ov.coachId : pClientRaw[5], status: ov.status != null ? ov.status : pClientRaw[6] }); },
      delClient: () => act.askConfirm("Remove " + pClientRaw[0] + "?", "This removes the client from your roster.", () => act.delClient(pClientRaw[0])),
    };
  }

  // ── coach self ──
  const mySessions = data.todaySessions.filter((s) => s.coachId === myId).map((s) => {
    const present = presentCount(s.id); const total = s.roster.length;
    return { time: s.time, dur: s.dur, category: s.category, type: s.type, location: s.location, present, total, isLive: s.state === "live", pct: (total ? Math.round(present / total * 100) : 0) + "%",
      roster: s.roster.map((p) => ({ name: p.name, hasInjury: !!p.injury, injury: p.injury, meta: p.meta, chipStyle: p.injury ? "border-color:rgba(245,158,11,.4); color:#fff;" : "" })),
      open: () => act.setState({ role: "admin", view: "attendance", selSession: s.id }) };
  });
  const myNotes: any[] = [];
  data.todaySessions.filter((s) => s.coachId === myId).forEach((s) => s.roster.forEach((p) => { if (p.injury) myNotes.push({ name: p.name, injury: p.injury, cat: s.category, grad: D.g("teal") }); }));
  const myChanges = data.scheduleChanges
    .filter((ch) => !ch.id || !state.resolvedChangeIds.includes(ch.id))
    .map((ch) => ({ name: ch.name, detail: ch.detail, kind: ch.kind, grad: D.g(ch.gradKey) }));
  const nextSession = mySessions.find((s) => s.isLive) || mySessions[0];

  // ── notifications ──
  const notifTypeStyle: Dict<string> = { money: "background:rgba(37,211,102,.14); color:var(--success);", member: "background:rgba(59,130,246,.14); color:var(--blue);", schedule: "background:rgba(245,158,11,.14); color:var(--warn);", injury: "background:rgba(239,68,68,.14); color:var(--danger);", lead: "background:rgba(139,92,246,.14); color:var(--violet);" };
  const notifIcon: Dict<string> = { money: "$", member: "◉", schedule: "▤", injury: "⚠", lead: "⚑" };
  const baseNotifs = isCoach ? data.notifRaw.filter((n) => ["injury", "schedule"].includes(n.type)) : data.notifRaw;
  const nf = state.notifFilter || "All";
  const notifTypeMatch = (n: any, f: string) => f === "All" ? true : f === "Members" ? (n.type === "member" || n.type === "lead") : n.type === ({ Money: "money", Schedule: "schedule", Injuries: "injury" } as Dict)[f];
  const notifFilterDef = isCoach ? ["All", "Injuries", "Schedule"] : ["All", "Money", "Members", "Schedule", "Injuries"];
  const notifFilters = notifFilterDef.map((f) => ({ label: f, count: baseNotifs.filter((n) => notifTypeMatch(n, f)).length, pick: () => act.setState({ notifFilter: f }), style: f === nf ? "background:var(--red); color:#fff; border-color:var(--red);" : "background:transparent; color:var(--muted2); border-color:var(--line2);" }));
  const notifFiltered = baseNotifs.filter((n) => notifTypeMatch(n, notifFilterDef.includes(nf) ? nf : "All"));
  const notifGroups = ["Today", "Yesterday", "Earlier"].map((grp) => ({ label: grp, items: notifFiltered.filter((n) => n.g === grp).map((n) => ({ title: n.title, detail: n.detail, time: n.time, icon: notifIcon[n.type], iconStyle: notifTypeStyle[n.type], hasAction: !!n.action, action: n.action || "", run: () => act.pushToast((n.action || "Opened") + " — " + n.title), rowStyle: n.unread ? "background:rgba(230,36,41,.045);" : "" })) })).filter((x) => x.items.length);
  const unreadCount = data.notifRaw.filter((n) => n.unread).length;
  const coachAlertCount = data.notifRaw.filter((n) => ["injury", "schedule"].includes(n.type)).length;

  // ── command palette ──
  const cmdNav = [{ t: "Today", k: "today", ic: "◎" }, { t: "Attendance", k: "attendance", ic: "✓" }, { t: "Schedule", k: "schedule", ic: "▤" }, { t: "Leads & Trials", k: "leads", ic: "⚑" }, { t: "Groups", k: "groups", ic: "⬡" }, { t: "Coaches", k: "coaches", ic: "◭" }, { t: "Clients", k: "clients", ic: "◉" }, { t: "Subscriptions", k: "subs", ic: "$" }, { t: "Reports", k: "reports", ic: "◔" }, { t: "Notifications", k: "notifications", ic: "◈" }, { t: "Settings", k: "settings", ic: "⚙" }];
  const cmdAll = [
    { label: "Quick actions", items: [
      { icon: "✓", iconStyle: "background:rgba(37,211,102,.14); color:var(--success);", title: "Mark attendance", sub: "Jump to the live session", hasSub: true, kind: "Action", run: () => act.setState({ role: "admin", view: "attendance", cmdOpen: false, cmdQuery: "" }) },
      { icon: "$", iconStyle: "background:rgba(239,68,68,.14); color:var(--danger);", title: "Record cash out", hasSub: false, kind: "Action", run: () => act.setState({ role: "admin", view: "subs", cashOutOpen: true, cmdOpen: false, cmdQuery: "" }) },
      { icon: "+", iconStyle: "background:rgba(230,36,41,.14); color:var(--red2);", title: "New member", hasSub: false, kind: "Action", run: () => act.setState({ role: "admin", intakeOpen: true, inKind: "client", cmdOpen: false, cmdQuery: "" }) },
      { icon: "⚑", iconStyle: "background:rgba(139,92,246,.14); color:var(--violet);", title: "Add lead", hasSub: false, kind: "Action", run: () => act.setState({ role: "admin", intakeOpen: true, inKind: "lead", cmdOpen: false, cmdQuery: "" }) },
    ] },
    { label: "Go to", items: cmdNav.map((n) => ({ icon: n.ic, iconStyle: "background:var(--surface3); color:var(--muted2);", title: n.t, hasSub: false, kind: "Page", run: () => act.setState({ role: "admin", view: n.k, cmdOpen: false, cmdQuery: "" }) })) },
    { label: "People", items: clients.map((c) => ({ icon: c.initials, iconStyle: "background:" + c.grad + "; color:#fff; font-family:var(--fd); font-size:.6rem; font-weight:700;", title: c.name, sub: c.category + " · " + c.status, hasSub: true, kind: "Client", run: () => act.setState({ role: "admin", view: "clients", profileName: c.name, cmdOpen: false, cmdQuery: "" }) })) },
    { label: "Coaches", items: data.coaches.map((c) => ({ icon: c.initials, iconStyle: "background:" + c.grad + "; color:#fff; font-family:var(--fd); font-size:.6rem; font-weight:700;", title: c.name, sub: c.role, hasSub: true, kind: "Coach", run: () => act.setState({ role: "admin", view: "coaches", cmdOpen: false, cmdQuery: "" }) })) },
  ];
  const cq = (state.cmdQuery || "").trim().toLowerCase();
  const cmdGroups = cq
    ? cmdAll.map((grp) => ({ label: grp.label, items: grp.items.filter((it: any) => (it.title + " " + (it.sub || "")).toLowerCase().includes(cq)) })).filter((grp) => grp.items.length)
    : cmdAll.slice(0, 3).map((grp) => grp.label === "People" ? { label: grp.label, items: grp.items.slice(0, 4) } : grp);
  const cmdEmpty = cmdGroups.length === 0;

  // ── reports ──
  const rng = state.repRange || "Month";
  const repRanges = ["Week", "Month", "Quarter"].map((r) => ({ label: r, pick: () => act.setState({ repRange: r }), style: r === rng ? "background:var(--red); color:#fff;" : "background:transparent; color:var(--muted);" }));
  const repPeriodLabel = data.report.periodLabel;
  const repKpis = data.report.kpis.map((kpi) => ({ ...kpi, deltaStyle: "color:var(--success);" }));
  const revMax = Math.max(1, ...data.report.revData.map((d) => d.v));
  const repRevBars = data.report.revData.map((d, i) => ({ label: d.m, val: "EGP " + d.v + "k", h: Math.round(d.v / revMax * 100) + "%", fill: i === data.report.revData.length - 1 ? "linear-gradient(180deg,var(--red2),var(--red))" : "var(--surface3)" }));
  const repAttCats = data.report.attCats.map((c) => ({ ...c, fill: "linear-gradient(90deg,var(--red),var(--red2))" }));
  const funnelFills = ["linear-gradient(90deg,#8b5cf6,#ec4899)", "linear-gradient(90deg,#3b82f6,#8b5cf6)", "linear-gradient(90deg,#14b8a6,#3b82f6)", "linear-gradient(90deg,#059669,#25d366)"];
  const repFunnel = data.report.funnel.map((row, i) => ({ ...row, fill: funnelFills[i % funnelFills.length] }));
  const repCoachUtil = data.coaches.map((c) => { const p = data.report.utilVals[c.id] || 50; return { name: c.name, initials: c.initials, grad: c.grad, pct: p + "%", fill: p >= 85 ? "linear-gradient(90deg,#ef4444,#e62429)" : (p >= 65 ? "linear-gradient(90deg,#f59e0b,#ef4444)" : "linear-gradient(90deg,#059669,#25d366)") }; });

  // ── settings ──
  const stab = state.setTab || "Studio";
  const setTabDef = [{ label: "Studio", icon: "⌂" }, { label: "Hours", icon: "◷" }, { label: "Classes & plans", icon: "▤" }, { label: "Team", icon: "◭" }, { label: "Notifications", icon: "◈" }];
  const setTabs = setTabDef.map((tb) => ({ label: tb.label, icon: tb.icon, pick: () => act.setState({ setTab: tb.label }), style: tb.label === stab ? "border-left-color:var(--red); background:linear-gradient(90deg,rgba(230,36,41,.12),transparent); color:#fff;" : "color:var(--muted2);" }));
  const setPanels: Dict<[string, string]> = { Studio: ["Studio profile", "Name, location and contact details"], Hours: ["Opening hours", "When the studio is open each day"], "Classes & plans": ["Classes & plans", "Categories offered and subscription pricing"], Team: ["Team & roles", "Coaches and their access level"], Notifications: ["Notification preferences", "What the studio gets alerted about"] };
  const setHours = D.SET_HOURS.map((h) => ({ ...h, pillStyle: h.status === "Open" ? "background:rgba(37,211,102,.12); color:var(--success);" : "background:rgba(245,158,11,.12); color:var(--warn);" }));
  const setCats = Object.keys(D.SET_CAT_COLORS).map((k) => ({ label: k, color: D.SET_CAT_COLORS[k] }));
  const allPlans = [...(state.userPlans || []), ...data.basePlans];
  const setPlans = allPlans.map((p, idx) => { const e = (state.planEdits || {})[idx] || {}; return { idx, name: e.name || p.name, detail: e.detail || p.detail, price: e.price || p.price }; })
    .filter((p) => !(state.deletedPlans || []).includes(p.name))
    .map((p) => ({ name: p.name, detail: p.detail, price: p.price, edit: () => act.openPlanEdit(p.idx, { name: p.name, detail: p.detail, price: p.price }), del: () => act.askConfirm("Delete " + p.name + "?", "This removes the plan from pricing.", () => act.delPlan(p.name)) }));
  const setTeam = allCoachIds.filter((id) => !deletedCoaches.includes(id)).map((id) => coachById(id)).map((c: any) => ({ name: c.name, initials: c.initials, grad: c.grad, cats: c.cats, role: c.role, roleStyle: c.role === "Head Coach" ? "background:rgba(230,36,41,.14); color:var(--red2);" : "background:var(--surface3); color:var(--muted2);", edit: () => act.openCoachEdit(c), del: () => act.askConfirm("Remove " + c.name + "?", "They will be taken off the team.", () => act.delCoach(c.id, c.name)) }));
  const setNotifPrefs = D.NOTIF_PREFS.map((p) => ({ label: p.label, detail: p.detail, trackStyle: p.on ? "background:var(--success);" : "background:var(--surface3);", knobStyle: p.on ? "left:20px;" : "left:2px;" }));

  // ── auth / login ──
  const lr = state.loginRole || "admin";
  const loginRoles = [
    { key: "admin", label: "Admin", hint: "Full studio access", email: "admin@marvelfit.eg" },
    { key: "coach", label: "Coach", hint: "Just my day", email: "ahmed.waheed@marvelfit.eg" },
  ].map((r) => ({ label: r.label, hint: r.hint, pick: () => act.setState({ loginRole: r.key, loginEmail: r.email, loginPassword: "", loginError: "" }), style: r.key === lr ? "border-color:var(--red); background:linear-gradient(135deg,rgba(230,36,41,.16),transparent); color:#fff;" : "border-color:var(--line2); background:var(--surface); color:var(--muted2);" }));

  return {
    isAdmin, isCoach,
    // auth
    isAuthed: state.authed, isLoggedOut: !state.authed,
    loginRoles, loginRoleLabel: lr === "coach" ? "Coach" : "Admin",
    loginEmail: state.loginEmail, loginPassword: state.loginPassword, loginError: state.loginError,
    setLoginEmail: (e: any) => act.setState({ loginEmail: e.target.value, loginError: "" }),
    setLoginPassword: (e: any) => act.setState({ loginPassword: e.target.value, loginError: "" }),
    signIn: () => {
      const email = (state.loginEmail || "").trim().toLowerCase(); const pw = state.loginPassword || "";
      if (!email || !pw) { act.setState({ loginError: "Enter your email and password." }); return; }
      const acc = D.ACCOUNTS[email]; // mock fallback only — live sessions arrive authed via next-auth
      if (!acc || acc.pw !== pw) { act.setState({ loginError: "Incorrect email or password." }); return; }
      act.setState({ authed: true, role: acc.role, loginRole: acc.role, view: "today", coachView: "today", loginError: "", loginPassword: "" });
    },
    signOut: () => act.doSignOut(),

    goReports: nav("reports"), goNotifs: nav("notifications"), goSettings: nav("settings"),
    navReports: navStyle("reports"), navNotifs: navStyle("notifications"), navSettings: navStyle("settings"),
    goCoachAlerts: () => act.setState({ coachView: "alerts" }), navCoachAlerts: coachNavStyle("alerts"),
    isReportsView: isAdmin && view === "reports", isSettingsView: isAdmin && view === "settings",
    isNotifView: (isAdmin && view === "notifications") || (isCoach && state.coachView === "alerts"),
    unreadCount, coachAlertCount,
    openCmd: () => act.setState({ cmdOpen: true, cmdQuery: "" }), closeCmd: () => act.setState({ cmdOpen: false, cmdQuery: "" }), cmdOpen: state.cmdOpen, cmdGroups, cmdEmpty,
    cmdQuery: state.cmdQuery, cmdType: (e: any) => act.setState({ cmdQuery: e.target.value }),
    notifFilters, notifGroups, notifEmpty: notifGroups.length === 0,
    clientsEmpty: clientsFiltered.length === 0,
    repRanges, repPeriodLabel, repKpis, repRevBars, repAttCats, repFunnel, repCoachUtil,
    setTabs, setPanelTitle: setPanels[stab][0], setPanelSub: setPanels[stab][1],
    setShowFields: stab === "Studio", setShowHours: stab === "Hours", setShowPlans: stab === "Classes & plans", setShowTeam: stab === "Team", setShowNotifPrefs: stab === "Notifications",
    setFields: data.setFields, setHours, setCats, setPlans, setTeam, setNotifPrefs,
    clientTiles, clientSegs, clientsFiltered,
    clientSearch: state.clientSearch, setClientSearch: (e: any) => act.setState({ clientSearch: e.target.value }),
    coachSearch: state.coachSearch, setCoachSearch: (e: any) => act.setState({ coachSearch: e.target.value }),
    leadSearch: state.leadSearch, setLeadSearch: (e: any) => act.setState({ leadSearch: e.target.value }),
    coachesEmpty: coachCards.length === 0,
    groupsEmpty: groups.length === 0,
    groupSearch: state.groupSearch, setGroupSearch: (e: any) => act.setState({ groupSearch: e.target.value }),
    addGroup: () => act.addGroup(),
    navToday: navStyle("today"), navAttendance: navStyle("attendance"), navSchedule: navStyle("schedule"),
    navLeads: navStyle("leads"), navClients: navStyle("clients"), navGroups: navStyle("groups"),
    navCoaches: navStyle("coaches"), navSubs: navStyle("subs"),
    navCoachToday: coachNavStyle("today"),
    goToday: nav("today"), goAttendance: nav("attendance"), goSchedule: nav("schedule"), goLeads: nav("leads"),
    goClients: nav("clients"), goGroups: nav("groups"), goCoaches: nav("coaches"), goSubs: nav("subs"),
    goCoachToday: () => act.setState({ coachView: "today" }),
    coachSelfName: self.name,
    liveCount: liveSession ? 1 : 0, changeCount: scheduleChanges.length, hasScheduleChanges: scheduleChanges.length > 0,
    leadCount: leadsView.length, expiringCount: data.headline.expiringCount, expiringValue: data.headline.expiringValue,
    userInitials: isAdmin ? (state.self?.initials ?? "MA") : self.initials,
    userName: isAdmin ? (state.self?.name ?? "Marvel Admin") : self.name,
    userRole: isAdmin ? "Admin · 6th of October" : (self.role || "Coach"), userGrad: isAdmin ? D.g("red") : self.grad,
    crumb: t[0], pageTitle: t[1], nowLabel: data.nowLabel,

    isTodayView: isAdmin && view === "today",
    isAttendanceView: isAdmin && view === "attendance",
    liveNames: liveSession ? coachById(liveSession.coachId).name.split(" ")[0] + " · " + liveSession.category : "Nothing live",
    sessionsToday: data.todaySessions.length, clientsExpected: data.todaySessions.reduce((a, s) => a + s.roster.length, 0),
    trialCount: trials.length, cashTodayNet: data.headline.cashTodayNet, cashTodayCount: data.headline.cashTodayCount,
    cashIn: data.headline.cashIn, cashOut: data.headline.cashOut,
    dateLong: data.dateLong,
    todaySessions: tSessions, trials, renewSoon, coachNow, methodsToday,

    isScheduleView: isAdmin && view === "schedule",
    isCoachesView: isAdmin && view === "coaches",
    isSubsView: isAdmin && view === "subs",
    isLeadsView: isAdmin && view === "leads",
    isGroupsView: isAdmin && view === "groups",
    isClientsView: isAdmin && view === "clients",
    isCoachTodayView: isCoach && state.coachView === "today",
    isCoachPhoneView: isCoach && state.coachView === "phone",

    weekDays: D.WEEK_DAYS, schedGrid, scheduleChanges,
    coachCards,
    addCoach: () => act.addCoach(),
    coachEditOpen: state.coachEditOpen,
    closeCoachEdit: () => act.setState({ coachEditOpen: false }),
    coachEditTitle: state.editCoachId ? "Edit coach" : "Add coach",
    coachEditCta: state.editCoachId ? "Save changes" : "Add coach",
    ceName: state.ceName, setCeName: (e: any) => act.setState({ ceName: e.target.value }),
    ceRole: state.ceRole, setCeRole: (e: any) => act.setState({ ceRole: e.target.value }),
    ceInitials: ceEditing ? ceEditing.initials : "＋", ceGrad: ceEditing ? ceEditing.grad : "var(--surface3)", ceIsEdit: !!ceEditing, ceCatChips,
    ceActive: state.ceActive, ceActiveTrack: state.ceActive ? "background:var(--success);" : "background:var(--surface3);", ceActiveKnob: state.ceActive ? "left:20px;" : "left:2px;",
    toggleCeActive: () => act.setState((s: OpsState) => ({ ceActive: !s.ceActive })),

    subs, subTiles, cashLedger, cashInMonth: data.report.cashInMonth, cashOutMonth: data.report.cashOutMonth, cashNetMonth: data.report.cashNetMonth, methodSplit: methodsToday,

    leadCols, leadSources, leadRows, leadStrip, leadsListEmpty,
    sortName: () => act.setLeadSort("name"), sortSource: () => act.setLeadSort("source"), sortWants: () => act.setLeadSort("wants"), sortStage: () => act.setLeadSort("stage"),
    arrName: leadArr("name"), arrSource: leadArr("source"), arrWants: leadArr("wants"), arrStage: leadArr("stage"),

    groups, clients,
    profileOpen: !!profile, profile, closeProfile: () => act.setState({ profileName: null }), stopProfile: (e: any) => e.stopPropagation(),

    intakeOpen: state.intakeOpen,
    openIntakeClient: () => act.setState({ intakeOpen: true, inKind: "client" }),
    openIntakeLead: () => act.setState({ intakeOpen: true, inKind: "lead" }),
    closeIntake: () => act.setState({ intakeOpen: false }), stopIntake: (e: any) => e.stopPropagation(),
    inIsLead: state.inKind === "lead",
    intakeTitle: state.inKind === "lead" ? "Add lead" : "New member",
    intakeSub: state.inKind === "lead" ? "Capture the enquiry — admin books the trial later" : "Register a client and their training details",
    inKindTabs: [
      { label: "New member", k: "client", style: state.inKind === "client" ? "background:var(--red); color:#fff;" : "background:transparent; color:var(--muted);", pick: () => act.setState({ inKind: "client" }) },
      { label: "Lead", k: "lead", style: state.inKind === "lead" ? "background:var(--red); color:#fff;" : "background:transparent; color:var(--muted);", pick: () => act.setState({ inKind: "lead" }) },
    ],
    inCats: ["Strength Class", "Burning Class", "Ladies Class", "Athlete Conditioning", "Calisthenics", "Rehab", "PT"].map((c) => ({ label: c, style: c === state.inCat ? "background:var(--red); color:#fff; border-color:var(--red);" : "background:transparent; color:var(--muted2); border-color:var(--line2);", pick: () => act.setState({ inCat: c }) })),
    inSources: ["WhatsApp", "Instagram", "Call", "On-ground"].map((s) => ({ label: s, style: s === state.inSource ? "background:#fff; color:#000; border-color:#fff;" : "background:transparent; color:var(--muted2); border-color:var(--line2);", pick: () => act.setState({ inSource: s }) })),
    inHasInjury: state.inHasInjury, injuryTrackStyle: state.inHasInjury ? "background:var(--warn);" : "background:var(--surface3);", injuryKnobStyle: state.inHasInjury ? "left:18px;" : "left:2px;",
    toggleInjury: () => act.setState((s: OpsState) => ({ inHasInjury: !s.inHasInjury })),
    inCat: state.inCat, intakeCta: state.inKind === "lead" ? "Save lead" : "Register member",
    inName: state.inName, setInName: (e: any) => act.setState({ inName: e.target.value }),
    inPhone: state.inPhone, setInPhone: (e: any) => act.setState({ inPhone: e.target.value }),
    submitIntake: () => act.submitIntake(),
    coWho: state.coWho, setCoWho: (e: any) => act.setState({ coWho: e.target.value }),
    coAmount: state.coAmount, setCoAmount: (e: any) => act.setState({ coAmount: e.target.value }),
    submitCashOut: () => act.submitCashOut(),
    saveCoach: () => act.saveCoach(),
    saveSettings: () => act.pushToast("Settings saved"), discardSettings: () => act.pushToast("Changes discarded", "warn"),
    markAllRead: () => act.markAllRead(),
    schedPrev: () => act.pushToast("Showing previous week"), schedNext: () => act.pushToast("Showing next week"),
    sendSummary: () => act.pushToast("Attendance summary sent to coach"),
    confirmOpen: !!state.confirm, confirmTitle: state.confirm ? state.confirm.title : "", confirmBody: state.confirm ? state.confirm.body : "",
    doConfirm: () => act.doConfirm(), closeConfirm: () => act.closeConfirm(),
    groupEditOpen: state.groupEditOpen, groupEditTitle: state.editGroupName ? "Edit group" : "New group", groupEditCta: state.editGroupName ? "Save changes" : "Create group",
    closeGroupEdit: () => act.setState({ groupEditOpen: false }), saveGroup: () => act.saveGroup(),
    geName: state.geName, setGeName: (e: any) => act.setState({ geName: e.target.value }),
    geCat: state.geCat, setGeCat: (e: any) => act.setState({ geCat: e.target.value }),
    geDays: state.geDays, setGeDays: (e: any) => act.setState({ geDays: e.target.value }),
    geTime: state.geTime, setGeTime: (e: any) => act.setState({ geTime: e.target.value }),
    geMembers: state.geMembers, setGeMembers: (e: any) => act.setState({ geMembers: e.target.value }),
    geCoachChips: allCoachIds.filter((id) => !deletedCoaches.includes(id)).map((id) => coachById(id)).map((c: any) => ({ label: c.name, style: c.id === state.geCoach ? "background:var(--red); color:#fff; border-color:var(--red);" : "background:transparent; color:var(--muted2); border-color:var(--line2);", pick: () => act.setState({ geCoach: c.id }) })),
    subEditOpen: state.subEditOpen, subEditName: state.editSubName, closeSubEdit: () => act.setState({ subEditOpen: false }), saveSubEdit: () => act.saveSubEdit(),
    seAmount: state.seAmount, setSeAmount: (e: any) => act.setState({ seAmount: e.target.value }),
    sePlanChips: ["Group", "Private", "Ladies", "PT", "Athlete"].map((p) => ({ label: p, style: p === state.sePlan ? "background:var(--red); color:#fff; border-color:var(--red);" : "background:transparent; color:var(--muted2); border-color:var(--line2);", pick: () => act.setState({ sePlan: p }) })),
    seMethodChips: ["InstaPay", "Visa", "Cash"].map((m) => ({ label: m, style: m === state.seMethod ? "background:#fff; color:#000; border-color:#fff;" : "background:transparent; color:var(--muted2); border-color:var(--line2);", pick: () => act.setState({ seMethod: m }) })),
    clientEditOpen: state.clientEditOpen, clientEditName: state.editClientName, closeClientEdit: () => act.setState({ clientEditOpen: false }), saveClientEdit: () => act.saveClientEdit(),
    clPhone: state.clPhone, setClPhone: (e: any) => act.setState({ clPhone: e.target.value }),
    clCatChips: ["Strength Class", "Burning Class", "Ladies Class", "Athlete Conditioning", "Calisthenics", "Rehab", "PT"].map((c) => ({ label: c, style: c === state.clCat ? "background:var(--red); color:#fff; border-color:var(--red);" : "background:transparent; color:var(--muted2); border-color:var(--line2);", pick: () => act.setState({ clCat: c }) })),
    clCoachChips: allCoachIds.filter((id) => !deletedCoaches.includes(id)).map((id) => coachById(id)).map((c: any) => ({ label: c.name, style: c.id === state.clCoach ? "background:var(--red); color:#fff; border-color:var(--red);" : "background:transparent; color:var(--muted2); border-color:var(--line2);", pick: () => act.setState({ clCoach: c.id }) })),
    clStatusChips: ["Active", "Trial", "Paused", "Inactive"].map((s) => ({ label: s, style: s === state.clStatus ? "background:var(--red); color:#fff; border-color:var(--red);" : "background:transparent; color:var(--muted2); border-color:var(--line2);", pick: () => act.setState({ clStatus: s }) })),
    planEditOpen: state.planEditOpen, planEditTitle: state.editPlanIdx != null ? "Edit plan" : "New plan", planEditCta: state.editPlanIdx != null ? "Save changes" : "Add plan",
    addPlan: () => act.addPlan(), closePlanEdit: () => act.setState({ planEditOpen: false }), savePlan: () => act.savePlan(),
    peName: state.peName, setPeName: (e: any) => act.setState({ peName: e.target.value }),
    peDetail: state.peDetail, setPeDetail: (e: any) => act.setState({ peDetail: e.target.value }),
    pePrice: state.pePrice, setPePrice: (e: any) => act.setState({ pePrice: e.target.value }),
    toastList: state.toasts.map((tt) => ({ key: tt.id, msg: tt.msg, style: tt.kind === "warn" ? "border-color:rgba(245,158,11,.55); background:rgba(245,158,11,.12);" : "border-color:rgba(37,211,102,.5); background:rgba(37,211,102,.1);", icon: tt.kind === "warn" ? "⚠" : "✓", iconColor: tt.kind === "warn" ? "var(--warn)" : "var(--success)" })),
    cashOutOpen: state.cashOutOpen,
    openCashOut: () => act.setState({ view: "subs", cashOutOpen: true }), closeCashOut: () => act.setState({ cashOutOpen: false }),
    coCat: state.coCat, coMethod: state.coMethod, stopModal: (e: any) => e.stopPropagation(),
    coCats: ["Salaries", "Studio needs", "Supplies", "Rent & bills", "Maintenance", "Other"].map((c) => ({ label: c, active: c === state.coCat, style: c === state.coCat ? "background:var(--red); color:#fff; border-color:var(--red);" : "background:transparent; color:var(--muted2); border-color:var(--line2);", pick: () => act.setState({ coCat: c }) })),
    coMethods: ["InstaPay", "Visa", "Cash"].map((m) => ({ label: m, active: m === state.coMethod, style: m === state.coMethod ? "background:#fff; color:#000; border-color:#fff;" : "background:transparent; color:var(--muted2); border-color:var(--line2);", pick: () => act.setState({ coMethod: m }) })),
    recentOut: [...state.userCashOuts, ...data.recentOut],
    mySessions, myNotes, myChanges, nextSession, myClientCount: data.coachSlots[myId]?.clients ?? 0,
    selfName: self.name, selfInitials: self.initials, selfGrad: self.grad, selfRole: self.role,

    sessionChips, selRoster,
    selCategory: sel.category, selType: sel.type, selCoach: selCoach.name, selCoachInitials: selCoach.initials, selCoachGrad: selCoach.grad, selTime: sel.time,
    selPresent: presentCount(sel.id), selTotal: sel.roster.length,
    selAbsent: countState(sel.id, "absent") + countState(sel.id, "noshow"), selLate: countState(sel.id, "late"),
    selPending: sel.roster.length - presentCount(sel.id) - countState(sel.id, "absent") - countState(sel.id, "noshow"),
    markAll: () => act.markAllPresent(sel.id),
  };
}
