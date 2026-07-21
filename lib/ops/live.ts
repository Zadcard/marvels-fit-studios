// Shared contract between the server bootstrap (lib/ops/bootstrap.ts) and the
// client store (lib/ops/store.tsx). OpsData carries every dynamic dataset the
// prototype previously hardcoded in lib/ops/data.ts; the mock fallback keeps
// /ops rendering when no payload is provided (e.g. storybook-style usage).
import * as D from "./data";
import type {
  AttState,
  ClientProfile,
  ClientRow,
  Coach,
  GradKey,
  LeadRow,
  Plan,
  Session,
  SubRow,
} from "./types";

export interface OpsTrialToday {
  leadId: string | null;
  name: string;
  initials: string;
  gradKey: GradKey;
  time: string;
  category: string;
  type: string;
  source: string;
}

export interface OpsRenewal {
  subscriptionId: string | null;
  name: string;
  initials: string;
  gradKey: GradKey;
  plan: string;
  amount: string;
  method: string;
  due: string;
  days: number;
}

export interface OpsMethodSplit {
  label: string;
  value: string;
  pct: string;
}

export interface OpsChangeRequest {
  id: string | null;
  name: string;
  initials: string;
  gradKey: GradKey;
  kind: "One session" | "Recurring";
  detail: string;
  reason: string;
}

export interface OpsSubMeta {
  subscriptionId: string;
  clientId: string;
  planId: string;
  renewalDate: string;
  subscriptionStatus: string;
  paymentStatus: string;
}

export interface OpsClientMeta {
  clientId: string;
  email: string;
  paymentStatus: "Paid" | "Unpaid" | "Due soon";
  groupId: string | null;
}

export interface OpsReportBundle {
  kpis: Array<{ label: string; value: string; delta: string }>;
  revData: Array<{ m: string; v: number }>;
  utilVals: Record<string, number>;
  attCats: Array<{ label: string; pct: string }>;
  funnel: Array<{ label: string; count: number; pct: string }>;
  cashInMonth: string;
  cashOutMonth: string;
  cashNetMonth: string;
  periodLabel: string;
}

export interface OpsHeadline {
  cashIn: string;
  cashOut: string;
  cashTodayNet: string;
  cashTodayCount: number;
  expiringCount: number;
  expiringValue: string;
}

export interface OpsSelf {
  role: "admin" | "coach";
  coachId: string | null;
  name: string;
  initials: string;
  title: string;
}

export interface OpsData {
  coaches: Coach[];
  coachStatus: Record<string, D.CoachStatus>;
  coachSlots: Record<string, D.CoachSlot>;
  coachEmails: Record<string, string>;
  todaySessions: Session[];
  initialAtt: Record<string, Record<string, AttState>>;
  subsRaw: SubRow[];
  subMeta: Record<string, OpsSubMeta>;
  cashRows: Array<[string, string, string, string, string]>;
  leadsRaw: LeadRow[];
  leadIds: Record<string, string>;
  injuryByLead: Record<string, string>;
  groupsRaw: Array<[string, string, string, string, string, number]>;
  groupIds: Record<string, string>;
  categoryIds: Record<string, string>;
  clientsRaw: ClientRow[];
  clientMeta: Record<string, OpsClientMeta>;
  clientProfiles: Record<string, ClientProfile>;
  notifRaw: D.NotifRow[];
  schedRows: Array<{ time: string; cells: (D.SchedCell | null)[] }>;
  trialsToday: OpsTrialToday[];
  renewSoon: OpsRenewal[];
  methodsToday: OpsMethodSplit[];
  scheduleChanges: OpsChangeRequest[];
  recentOut: Array<{ label: string; cat: string; amount: string; method: string; date: string }>;
  basePlans: Plan[];
  planIds: Record<string, string>;
  setFields: Array<{ label: string; value: string; span: string }>;
  report: OpsReportBundle;
  headline: OpsHeadline;
  dateLong: string;
  nowLabel: string;
}

export interface OpsInitial {
  data: OpsData;
  self: OpsSelf;
}

export const GRAD_KEYS: GradKey[] = ["red", "blue", "violet", "amber", "green", "teal"];

export function gradKeyFor(name: string): GradKey {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  return GRAD_KEYS[Math.abs(hash) % GRAD_KEYS.length];
}

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase() || "?";
}

/** Mock fallback so the app still renders without a server payload. */
export function mockOpsData(): OpsData {
  return {
    coaches: D.COACHES,
    coachStatus: D.COACH_STATUS,
    coachSlots: D.COACH_SLOTS,
    coachEmails: {},
    todaySessions: D.TODAY_SESSIONS,
    initialAtt: {},
    subsRaw: D.SUBS_RAW,
    subMeta: {},
    cashRows: D.CASH_ROWS,
    leadsRaw: D.LEADS_RAW,
    leadIds: {},
    injuryByLead: D.INJURY_BY_LEAD,
    groupsRaw: D.GROUPS_RAW,
    groupIds: {},
    categoryIds: {},
    clientsRaw: D.CLIENTS_RAW,
    clientMeta: {},
    clientProfiles: D.CLIENT_PROFILES,
    notifRaw: D.NOTIF_RAW,
    schedRows: D.SCHED_ROWS,
    trialsToday: [
      { leadId: null, name: "Farida Ashraf", initials: "FA", gradKey: "violet", time: "12:00", category: "Ladies Class", type: "Group trial", source: "Instagram" },
      { leadId: null, name: "Yassin Adel", initials: "YA", gradKey: "blue", time: "6:30 PM", category: "Athlete Cond.", type: "Group trial", source: "WhatsApp" },
    ],
    renewSoon: [
      { subscriptionId: null, name: "Sara Nabil", initials: "SN", gradKey: "violet", plan: "Private Monthly", amount: "EGP 2,800", method: "InstaPay", due: "2 days", days: 2 },
      { subscriptionId: null, name: "Karim Samir", initials: "KS", gradKey: "blue", plan: "Group Monthly", amount: "EGP 1,400", method: "Visa", due: "3 days", days: 3 },
      { subscriptionId: null, name: "Laila Mansour", initials: "LM", gradKey: "teal", plan: "PT · 8 sessions", amount: "EGP 3,600", method: "Cash", due: "5 days", days: 5 },
      { subscriptionId: null, name: "Dina Ragab", initials: "DR", gradKey: "green", plan: "Group Monthly", amount: "EGP 1,400", method: "InstaPay", due: "6 days", days: 6 },
    ],
    methodsToday: [
      { label: "InstaPay", value: "EGP 4,200", pct: "54%" },
      { label: "Visa", value: "EGP 2,800", pct: "36%" },
      { label: "Cash", value: "EGP 800", pct: "10%" },
    ],
    scheduleChanges: [
      { id: null, name: "Ali Hassan", initials: "AH", gradKey: "teal", kind: "One session", detail: "Move Strength Class → tomorrow 5:00 PM", reason: "Work travel" },
      { id: null, name: "Reham Badawy", initials: "RB", gradKey: "green", kind: "Recurring", detail: "Ladies Class Sat+Tue → Sun+Wed", reason: "University exams" },
      { id: null, name: "Sara Nabil", initials: "SN", gradKey: "violet", kind: "One session", detail: "Cancel Private · Thu 8:00 PM", reason: "Knee flare-up" },
    ],
    recentOut: [
      { label: "Coach Ahmed Waheed", cat: "Salaries", amount: "EGP 8,500", method: "InstaPay", date: "01 Feb" },
      { label: "Coach Mariam Soliman", cat: "Salaries", amount: "EGP 6,200", method: "InstaPay", date: "01 Feb" },
      { label: "New dumbbells set", cat: "Studio needs", amount: "EGP 4,300", method: "Visa", date: "08 Feb" },
      { label: "Studio towels + spray", cat: "Supplies", amount: "EGP 650", method: "Cash", date: "12 Feb" },
      { label: "Electricity + water", cat: "Rent & bills", amount: "EGP 2,800", method: "InstaPay", date: "14 Feb" },
    ],
    basePlans: D.BASE_PLANS,
    planIds: {},
    setFields: D.SET_FIELDS,
    report: {
      kpis: [
        { label: "Revenue", value: "EGP 148k", delta: "▲ 12% vs prev" },
        { label: "New members", value: "23", delta: "▲ 4 vs prev" },
        { label: "Churn", value: "5", delta: "▼ 2 vs prev" },
        { label: "Avg attendance", value: "82%", delta: "▲ 3 pts" },
      ],
      revData: D.REV_DATA,
      utilVals: D.UTIL_VALS,
      attCats: [
        { label: "Strength Class", pct: "88%" },
        { label: "Ladies Class", pct: "84%" },
        { label: "Athlete Cond.", pct: "79%" },
        { label: "Burning Class", pct: "72%" },
        { label: "Calisthenics", pct: "68%" },
      ],
      funnel: [
        { label: "Leads", count: 48, pct: "100%" },
        { label: "Trials booked", count: 34, pct: "71%" },
        { label: "Trials done", count: 27, pct: "56%" },
        { label: "Subscribed", count: 19, pct: "40%" },
      ],
      cashInMonth: "EGP 148,400",
      cashOutMonth: "EGP 22,900",
      cashNetMonth: "EGP 125,500",
      periodLabel: "This month",
    },
    headline: {
      cashIn: "EGP 7,800",
      cashOut: "EGP 1,150",
      cashTodayNet: "EGP 7,800",
      cashTodayCount: 6,
      expiringCount: 5,
      expiringValue: "EGP 11,200",
    },
    dateLong: "Thursday · 16 July 2026",
    nowLabel: "Thu 16 Jul · 5:24 PM",
  };
}
