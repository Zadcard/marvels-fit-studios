import type {
  Account, ClientProfile, ClientRow, Coach, GradKey, LeadRow, Plan, Session, SubRow,
} from "./types";

// ─────────────────────────────────────────────────────────────────────────
//  MOCK DATA
//  Swap these arrays for API calls in the store (see lib/store.tsx TODO markers).
// ─────────────────────────────────────────────────────────────────────────

export const GRADS: Record<GradKey, string> = {
  red: "linear-gradient(135deg,#e62429,#ff4f54)",
  blue: "linear-gradient(135deg,#3b82f6,#8b5cf6)",
  violet: "linear-gradient(135deg,#8b5cf6,#ec4899)",
  amber: "linear-gradient(135deg,#f59e0b,#ef4444)",
  green: "linear-gradient(135deg,#059669,#25d366)",
  teal: "linear-gradient(135deg,#14b8a6,#3b82f6)",
  slate: "linear-gradient(135deg,#475569,#64748b)",
};
export const g = (k: GradKey) => GRADS[k];

export const COACHES: Coach[] = [
  { id: "c1", name: "Ahmed Waheed", initials: "AW", role: "Head Coach", cats: "Strength · Athlete", grad: GRADS.red },
  { id: "c2", name: "Youssef Abdelatif", initials: "YA", role: "Strength Coach", cats: "Athlete Cond.", grad: GRADS.blue },
  { id: "c3", name: "Mariam Soliman", initials: "MS", role: "Ladies & Rehab", cats: "Ladies · Rehab", grad: GRADS.violet },
  { id: "c4", name: "Khaled Habib", initials: "KH", role: "Calisthenics", cats: "Calisthenics", grad: GRADS.amber },
  { id: "c5", name: "Nour Rashad", initials: "NR", role: "Conditioning", cats: "Burning · Cond.", grad: GRADS.green },
  { id: "c6", name: "Hisham Mostafa", initials: "HM", role: "PT & Rehab", cats: "PT · Rehab", grad: GRADS.teal },
];

const R = (name: string, injury = "", trial = false, meta = "") =>
  ({ id: name.replace(/\s/g, "").toLowerCase(), name, injury, isTrial: trial, meta });

export const TODAY_SESSIONS: Session[] = [
  { id: "t1", time: "7:00 AM", dur: "60 MIN", category: "Burning Class", type: "Group", coachId: "c5", location: "Main studio", state: "done",
    roster: [R("Kareem Adel", "", false, "Member · 4th session"), R("Mostafa Nabil", "", false, "Member"), R("Seif Amr", "", false, "Member"), R("Amr Gamal", "Ankle sprain (healing)", false, "Member"), R("Ziad Khaled", "", false, "Member"), R("Marwan Sherif", "", false, "Member")] },
  { id: "t2", time: "9:00 AM", dur: "60 MIN", category: "Ladies Class", type: "Group", coachId: "c3", location: "Main studio", state: "done",
    roster: [R("Nada Sherif", "", false, "Member"), R("Salma Ayman", "Lower back — disc", false, "Member"), R("Menna Tarek", "", false, "Member"), R("Habiba Wael", "", false, "Member · new"), R("Reem Osama", "", false, "Member")] },
  { id: "t3", time: "11:30 AM", dur: "45 MIN", category: "Rehab", type: "Private", coachId: "c3", location: "Rehab corner", state: "done",
    roster: [R("Malak Sameh", "Right shoulder impingement", false, "Private · knee + shoulder rehab")] },
  { id: "t4", time: "5:00 PM", dur: "60 MIN", category: "Strength Class", type: "Group", coachId: "c1", location: "Main studio", state: "live",
    roster: [R("Omar Tarek", "", false, "Member"), R("Youssef Sami", "", false, "Member"), R("Ali Hassan", "Left knee — ACL recovery", false, "Member"), R("Tarek Fouad", "", false, "Member"), R("Hazem Salah", "", false, "Member"), R("Mohab Ehab", "", false, "Member"), R("Fady Nader", "", false, "Member · new"), R("Kareem Adel", "", false, "Member")] },
  { id: "t5", time: "6:30 PM", dur: "75 MIN", category: "Athlete Conditioning", type: "Group", coachId: "c2", location: "Main studio", state: "upcoming",
    roster: [R("Ziad Khaled", "", false, "Football · U18"), R("Seif Amr", "", false, "Tennis"), R("Omar Tarek", "", false, "Football"), R("Marwan Sherif", "Hamstring tightness", false, "Football"), R("Yassin Adel", "", true, "Tennis · trial"), R("Nour Adel", "", false, "Tennis")] },
  { id: "t6", time: "8:00 PM", dur: "60 MIN", category: "Calisthenics", type: "Group", coachId: "c4", location: "Rig zone", state: "upcoming",
    roster: [R("Mohab Ehab", "", false, "Member"), R("Fady Nader", "", false, "Member"), R("Hazem Salah", "", false, "Member"), R("Ali Hassan", "Left knee — ACL recovery", false, "Member"), R("Tarek Fouad", "", false, "Member"), R("Youssef Sami", "", false, "Member"), R("Amr Gamal", "", false, "Member")] },
];

export interface CoachStatus { now: string; status: string; k: string; }
export const COACH_STATUS: Record<string, CoachStatus> = {
  c1: { now: "Strength Class · until 6:00 PM", status: "Live", k: "live" },
  c2: { now: "Next session at 6:30 PM", status: "Later", k: "later" },
  c3: { now: "Wrapped Rehab · 11:30 AM", status: "Break", k: "break" },
  c5: { now: "Done at 8:00 AM", status: "Done", k: "off" },
  c4: { now: "Calisthenics at 8:00 PM", status: "Later", k: "later" },
  c6: { now: "Not in today", status: "Off today", k: "off" },
};

export interface CoachSlot { blocks: [string, number][]; today: string; week: number; clients: number; }
export const COACH_SLOTS: Record<string, CoachSlot> = {
  c1: { blocks: [["7a", 0], ["9a", 0], ["11a", 0], ["1p", 0], ["3p", 0], ["5p", 2], ["7p", 0]], today: "1 group left", week: 14, clients: 38 },
  c2: { blocks: [["7a", 0], ["9a", 0], ["11a", 0], ["1p", 0], ["3p", 0], ["5p", 0], ["6p", 2], ["8p", 0]], today: "Next session at 6:30 PM", week: 9, clients: 22 },
  c3: { blocks: [["7a", 0], ["9a", 2], ["11a", 1], ["1p", 0], ["3p", 0], ["5p", 0], ["7p", 0]], today: "Done for today", week: 11, clients: 19 },
  c4: { blocks: [["7a", 0], ["9a", 0], ["11a", 0], ["1p", 0], ["3p", 0], ["5p", 0], ["8p", 2]], today: "Calisthenics at 8:00 PM", week: 8, clients: 24 },
  c5: { blocks: [["7a", 2], ["9a", 0], ["11a", 0], ["1p", 0], ["3p", 0], ["5p", 0], ["7p", 0]], today: "Done at 8:00 AM", week: 6, clients: 16 },
  c6: { blocks: [], today: "No sessions today", week: 7, clients: 14 },
};

export const SUBS_RAW: SubRow[] = [
  ["Sara Nabil", "SN", "violet", "Private", 2800, "InstaPay", "Expiring", "16 Feb", "in 2 days", 12, 10],
  ["Karim Samir", "KS", "blue", "Group", 1400, "Visa", "Expiring", "19 Feb", "in 3 days", 12, 11],
  ["Laila Mansour", "LM", "teal", "PT", 3600, "Cash", "Expiring", "21 Feb", "in 5 days", 8, 7],
  ["Omar Tarek", "OT", "red", "Group", 1400, "InstaPay", "Active", "04 Mar", "in 16 days", 16, 5],
  ["Nada Sherif", "NS", "green", "Ladies", 1400, "InstaPay", "Active", "09 Mar", "in 21 days", 12, 3],
  ["Reham Badawy", "RB", "green", "Group", 1400, "Visa", "Expired", "08 Feb", "5 days ago", 8, 8],
  ["Mostafa Nabil", "MN", "amber", "Group", 1400, "Cash", "Expired", "06 Feb", "7 days ago", 12, 12],
  ["Ali Hassan", "AH", "teal", "Private", 2800, "InstaPay", "Renewed", "12 Mar", "renewed", 20, 2],
  ["Menna Tarek", "MT", "violet", "Ladies", 1400, "Visa", "Renewed", "14 Mar", "renewed", 16, 1],
];

export const CASH_ROWS: [string, string, string, string, string][] = [
  ["in", "Sara Nabil — Private renewal", "InstaPay", "+2,800", "17:02"],
  ["in", "Omar Tarek — Group monthly", "InstaPay", "+1,400", "15:40"],
  ["in", "Laila Mansour — PT block", "Cash", "+800", "13:15"],
  ["in", "Nada Sherif — Ladies monthly", "Visa", "+1,400", "11:20"],
  ["out", "Studio towels + supplies", "Cash", "−650", "10:05"],
  ["out", "Coach Khaled — session fees", "InstaPay", "−500", "09:30"],
];

export const LEADS_RAW: LeadRow[] = [
  ["New", "Hana Mahmoud", "HM", "violet", "WhatsApp", "+20 100 442 1180", "Ladies Class", "Prefers mornings", ""],
  ["New", "Tamer Fouad", "TF", "blue", "Call", "+20 122 900 3341", "Strength Class", "Wants evening group", ""],
  ["New", "Salma Osman", "SO", "green", "Instagram", "+20 111 220 7789", "Burning Class", "Fat-loss goal", ""],
  ["Trial booked", "Farida Ashraf", "FA", "violet", "Instagram", "+20 106 771 2093", "Ladies Class", "Trial today", "Ladies Class · today 9:00 AM"],
  ["Trial booked", "Yassin Adel", "YA", "blue", "WhatsApp", "+20 100 553 8842", "Athlete Conditioning", "Plays tennis", "Athlete Cond. · today 6:30 PM"],
  ["Trial booked", "Mahmoud Refaat", "MR", "amber", "On-ground", "+20 109 330 5567", "Calisthenics", "Walked in", "Calisthenics · Sat 8:00 PM"],
  ["Trial done", "Rana Ehab", "RE", "green", "WhatsApp", "+20 114 662 9930", "Burning Class", "Deciding on plan", ""],
  ["Trial done", "Kareem Zaki", "KZ", "red", "Call", "+20 120 118 4425", "Strength Class", "Comparing pricing", ""],
  ["Won", "Nour Hassan", "NH", "teal", "Instagram", "+20 101 334 5512", "Group", "Subscribed · Group Monthly", ""],
  ["Won", "Habiba Wael", "HW", "violet", "On-ground", "+20 115 447 2201", "Ladies Class", "Subscribed · Ladies Monthly", ""],
  ["Lost", "Sherif Adel", "SA", "amber", "Call", "+20 128 990 1123", "Strength Class", "Chose gym near home", ""],
];

export const INJURY_BY_LEAD: Record<string, string> = { "Rana Ehab": "Old ankle sprain", "Yassin Adel": "Wrist — tapes it" };

export const GROUPS_RAW: [string, string, string, string, string, number][] = [
  ["Strength Class", "c1", "Sat · Mon · Wed · Thu", "5:00 PM", "Strength", 16],
  ["Burning Class", "c5", "Sat · Mon · Wed · Thu", "7:00 AM", "Fat loss", 12],
  ["Ladies Class", "c3", "Sat · Sun · Tue · Thu · Fri", "9:00 AM", "Ladies", 9],
  ["Athlete Conditioning", "c2", "Sat · Mon · Wed · Thu · Fri", "6:30 PM", "Athlete", 7],
  ["Calisthenics", "c4", "Sat · Sun · Tue · Wed · Thu", "8:00 PM", "Calisthenics", 9],
];

export const CLIENTS_RAW: ClientRow[] = [
  ["Omar Tarek", "OT", "red", "Strength Class", "Group", "c1", "Active", "+20 100 221 3411", ""],
  ["Sara Nabil", "SN", "violet", "PT", "Private", "c3", "Active", "+20 109 882 1145", "Post-op knee"],
  ["Ali Hassan", "AH", "teal", "Strength Class", "Group", "c1", "Active", "+20 122 734 2210", "Left knee — ACL recovery"],
  ["Nada Sherif", "NS", "green", "Ladies Class", "Group", "c3", "Active", "+20 114 522 9087", ""],
  ["Reham Badawy", "RB", "green", "Ladies Class", "Group", "c3", "Paused", "+20 111 409 3388", ""],
  ["Malak Sameh", "MK", "violet", "Rehab", "Private", "c3", "Active", "+20 120 500 1192", "Right shoulder impingement"],
  ["Ziad Khaled", "ZK", "blue", "Athlete Conditioning", "Group", "c2", "Active", "+20 103 847 6690", "Football · U18"],
  ["Yassin Adel", "YA", "blue", "Athlete Conditioning", "Group", "c2", "Trial", "+20 100 553 8842", "Wrist — tapes it"],
  ["Mostafa Nabil", "MN", "amber", "Burning Class", "Group", "c5", "Inactive", "+20 101 334 5512", ""],
  ["Habiba Wael", "HW", "violet", "Ladies Class", "Group", "c3", "Active", "+20 115 662 7740", ""],
];

export const CLIENT_PROFILES: Record<string, ClientProfile> = {
  "Omar Tarek": { joined: "Aug 2025", plan: "Group Monthly", bundle: 16, used: 5, streak: 9, attRate: 92, days: "Sat · Mon · Wed · Thu · 5:00 PM", injuryHist: [], history: ["Renewed Group Monthly — 04 Feb", "Attended Strength Class — 14 Feb", "9-session attendance streak"] },
  "Sara Nabil": { joined: "Nov 2025", plan: "Private Monthly", bundle: 12, used: 10, streak: 2, attRate: 78, days: "Sun · Wed · 11:30 AM", injuryHist: ["Post-op knee — cleared for loading", "Avoid deep flexion under load"], history: ["Expiring in 2 days — reminder sent", "Rescheduled 09 Feb → travel", "Started PT block Nov 2025"] },
  "Ali Hassan": { joined: "Jun 2025", plan: "Group Monthly", bundle: 16, used: 6, streak: 4, attRate: 85, days: "Sat · Mon · Wed · Thu · 5:00 PM", injuryHist: ["Left knee — ACL recovery", "Modify squats: box depth only"], history: ["Requested move today → tomorrow 5:00 PM", "Attended Calisthenics — 12 Feb", "Joined Strength Class Jun 2025"] },
  "Nada Sherif": { joined: "Oct 2025", plan: "Ladies Monthly", bundle: 12, used: 3, streak: 6, attRate: 88, days: "Sat · Sun · Tue · Thu · Fri · 9:00 AM", injuryHist: [], history: ["Renewed Ladies Monthly — 09 Feb", "Attended Ladies Class — 15 Feb"] },
  "Reham Badawy": { joined: "Sep 2025", plan: "Group Monthly", bundle: 8, used: 8, streak: 0, attRate: 54, days: "Sun · Wed (changed)", injuryHist: [], history: ["Paused — university exams", "Recurring change: Sat+Tue → Sun+Wed", "Subscription expired 08 Feb"] },
  "Malak Sameh": { joined: "Dec 2025", plan: "Private Monthly", bundle: 12, used: 4, streak: 3, attRate: 80, days: "Sun · Tue · Thu · 11:30 AM", injuryHist: ["Right shoulder impingement", "No overhead pressing yet"], history: ["Rehab plan started Dec 2025", "Attended Rehab — 16 Feb"] },
  "Ziad Khaled": { joined: "Jul 2025", plan: "Group Monthly", bundle: 20, used: 7, streak: 5, attRate: 90, days: "Sat · Mon · Wed · Thu · Fri · 6:30 PM", injuryHist: ["Hamstring tightness — monitor"], history: ["Football U18 squad", "Attended Athlete Cond. — 15 Feb"] },
  "Yassin Adel": { joined: "Trial", plan: "Trial", bundle: 0, used: 0, streak: 0, attRate: 0, days: "Athlete Cond. · today 6:30 PM", injuryHist: ["Wrist — tapes it"], history: ["Trial booked today 6:30 PM", "Lead source: WhatsApp", "Plays tennis"] },
  "Mostafa Nabil": { joined: "May 2025", plan: "Group Monthly", bundle: 12, used: 12, streak: 0, attRate: 41, days: "Sat · Mon · Wed · Thu · 7:00 AM", injuryHist: [], history: ["Inactive — no visits in 3 weeks", "Subscription expired 06 Feb"] },
  "Habiba Wael": { joined: "Feb 2026", plan: "Ladies Monthly", bundle: 16, used: 1, streak: 1, attRate: 100, days: "Sat · Sun · Tue · Thu · Fri · 9:00 AM", injuryHist: [], history: ["Just subscribed — Ladies Monthly", "Converted from on-ground lead"] },
};

export interface NotifRow { g: string; type: string; title: string; detail: string; time: string; unread?: boolean; action?: string; }
export const NOTIF_RAW: NotifRow[] = [
  { g: "Today", type: "injury", title: "Ali Hassan flagged an injury", detail: "Left knee — ACL recovery. Modify squats: box depth only.", time: "12m", unread: true, action: "View" },
  { g: "Today", type: "money", title: "Payment received — Nada Sherif", detail: "Ladies Monthly renewed · EGP 1,400 · InstaPay", time: "40m", unread: true },
  { g: "Today", type: "schedule", title: "Schedule change request", detail: "Ali Hassan wants to move today’s Strength → tomorrow 5:00 PM", time: "1h", unread: true, action: "Review" },
  { g: "Today", type: "lead", title: "New lead — Yassin Adel", detail: "WhatsApp · wants Athlete Conditioning · trial today 6:30 PM", time: "2h", action: "Assign" },
  { g: "Yesterday", type: "member", title: "Habiba Wael subscribed", detail: "Converted from on-ground lead · Ladies Monthly", time: "Wed" },
  { g: "Yesterday", type: "money", title: "Cash out recorded", detail: "New dumbbells set · EGP 4,300 · Visa", time: "Wed" },
  { g: "Yesterday", type: "schedule", title: "Reham Badawy paused subscription", detail: "University exams — resumes March", time: "Wed" },
  { g: "Earlier", type: "injury", title: "Salma Ayman — lower back (disc)", detail: "Avoid loaded flexion. Cleared for machines only.", time: "Mon" },
  { g: "Earlier", type: "member", title: "Mostafa Nabil marked inactive", detail: "No visits in 3 weeks · subscription expired 06 Feb", time: "Mon", action: "Follow up" },
];

// Schedule week grid (Saturday-first).
export interface SchedCell { cat: string; coach: string; priv?: boolean; today?: boolean; live?: boolean; }
export const SCHED_ROWS: { time: string; cells: (SchedCell | null)[] }[] = [
  { time: "7:00 AM", cells: [{ cat: "Burning", coach: "c5" }, null, { cat: "Burning", coach: "c5" }, null, { cat: "Burning", coach: "c5" }, { cat: "Burning", coach: "c5", today: true }, null] },
  { time: "9:00 AM", cells: [{ cat: "Ladies", coach: "c3" }, { cat: "Ladies", coach: "c3" }, null, { cat: "Ladies", coach: "c3" }, null, { cat: "Ladies", coach: "c3", today: true }, { cat: "Ladies", coach: "c3" }] },
  { time: "11:30 AM", cells: [null, { cat: "Rehab", coach: "c3", priv: true }, null, { cat: "Rehab", coach: "c3", priv: true }, null, { cat: "Rehab", coach: "c3", priv: true, today: true }, null] },
  { time: "5:00 PM", cells: [{ cat: "Strength", coach: "c1" }, { cat: "Strength", coach: "c1" }, { cat: "Strength", coach: "c1" }, { cat: "Strength", coach: "c1" }, { cat: "Strength", coach: "c1" }, { cat: "Strength", coach: "c1", today: true, live: true }, null] },
  { time: "6:30 PM", cells: [{ cat: "Athlete Cond.", coach: "c2" }, null, { cat: "Athlete Cond.", coach: "c2" }, null, { cat: "Athlete Cond.", coach: "c2" }, { cat: "Athlete Cond.", coach: "c2", today: true }, { cat: "Athlete Cond.", coach: "c2" }] },
  { time: "8:00 PM", cells: [{ cat: "Calisthenics", coach: "c4" }, { cat: "Calisthenics", coach: "c4" }, null, { cat: "Calisthenics", coach: "c4" }, { cat: "Calisthenics", coach: "c4" }, { cat: "Calisthenics", coach: "c4", today: true }, null] },
];
export const WEEK_DAYS = ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"];
export const SCHED_CAT_COLOR: Record<string, string> = { Burning: "#25d366", Ladies: "#8b5cf6", Rehab: "#14b8a6", Strength: "#e62429", "Athlete Cond.": "#3b82f6", Calisthenics: "#f59e0b" };

export const LEAD_CAT_COLOR: Record<string, string> = { "Ladies Class": "#8b5cf6", "Strength Class": "#e62429", "Burning Class": "#f59e0b", "Athlete Conditioning": "#3b82f6", Calisthenics: "#14b8a6", Rehab: "#25d366", PT: "#ec4899", Group: "#e62429" };

// Reports
export const REV_DATA = [{ m: "Feb", v: 112 }, { m: "Mar", v: 124 }, { m: "Apr", v: 118 }, { m: "May", v: 133 }, { m: "Jun", v: 141 }, { m: "Jul", v: 148 }];
export const UTIL_VALS: Record<string, number> = { c1: 92, c2: 74, c3: 86, c4: 61, c5: 70, c6: 48 };

// Settings
export const SET_HOURS: { day: string; hours: string; status: string }[] = [
  { day: "Saturday", hours: "7:00 AM – 10:00 PM", status: "Open" }, { day: "Sunday", hours: "7:00 AM – 10:00 PM", status: "Open" },
  { day: "Monday", hours: "7:00 AM – 10:00 PM", status: "Open" }, { day: "Tuesday", hours: "7:00 AM – 10:00 PM", status: "Open" },
  { day: "Wednesday", hours: "7:00 AM – 10:00 PM", status: "Open" }, { day: "Thursday", hours: "7:00 AM – 10:00 PM", status: "Open" },
  { day: "Friday", hours: "2:00 PM – 10:00 PM", status: "Short" },
];
export const SET_CAT_COLORS: Record<string, string> = { "Strength Class": "#e62429", "Burning Class": "#f59e0b", "Ladies Class": "#8b5cf6", "Athlete Conditioning": "#3b82f6", Calisthenics: "#14b8a6", Rehab: "#25d366", PT: "#ec4899" };
export const SET_FIELDS = [
  { label: "Studio name", value: "Marvel Fitness Studios", span: "grid-column:1 / -1;" },
  { label: "Location", value: "6th of October City, Giza", span: "" },
  { label: "Phone", value: "+20 100 000 1234", span: "" },
  { label: "Instagram", value: "@marvelfit.studios", span: "" },
  { label: "Week starts on", value: "Saturday", span: "" },
];
export const BASE_PLANS: Plan[] = [
  { name: "Group Monthly", detail: "Unlimited group classes · 30 days", price: "EGP 1,400" },
  { name: "Private Monthly", detail: "12 private sessions · 30 days", price: "EGP 3,600" },
  { name: "Ladies Monthly", detail: "Unlimited ladies classes · 30 days", price: "EGP 1,300" },
  { name: "Athlete Bundle", detail: "20 conditioning sessions", price: "EGP 2,800" },
];
export const NOTIF_PREFS = [
  { label: "Expiring subscriptions", detail: "Alert 7 days before a member’s plan ends", on: true },
  { label: "New leads", detail: "Notify when a lead comes in from any source", on: true },
  { label: "Injury flags", detail: "Surface every injury to the assigned coach", on: true },
  { label: "Daily cash summary", detail: "End-of-day cash in/out recap at 10:00 PM", on: false },
  { label: "Low attendance", detail: "Flag members who miss 3+ sessions", on: true },
];

/** Demo credentials. TODO: replace with a real auth endpoint. */
export const ACCOUNTS: Record<string, Account> = {
  "admin@marvelfit.eg": { pw: "marvel2026", role: "admin" },
  "ahmed.waheed@marvelfit.eg": { pw: "coach2026", role: "coach" },
};

export const fmtEGP = (n: number) => "EGP " + n.toLocaleString("en-US");

// ── Pure style-string lookups (returned to components, applied via css()) ──
export const srcStyle = (s: string) => ({
  WhatsApp: "background:rgba(37,211,102,.12); border:1px solid rgba(37,211,102,.4); color:var(--success);",
  Call: "background:rgba(59,130,246,.12); border:1px solid rgba(59,130,246,.4); color:var(--blue);",
  Instagram: "background:rgba(236,72,153,.12); border:1px solid rgba(236,72,153,.4); color:#ec4899;",
  "On-ground": "background:rgba(245,158,11,.12); border:1px solid rgba(245,158,11,.4); color:var(--warn);",
}[s] || "");
export const methodBadge = (m: string) => ({
  InstaPay: "background:rgba(230,36,41,.12); border:1px solid rgba(230,36,41,.35); color:var(--red2);",
  Visa: "background:rgba(59,130,246,.12); border:1px solid rgba(59,130,246,.35); color:var(--blue);",
  Cash: "background:rgba(37,211,102,.12); border:1px solid rgba(37,211,102,.35); color:var(--success);",
}[m] || "");
export const subStatusPill = (s: string) => ({
  Active: "background:rgba(37,211,102,.12); border:1px solid rgba(37,211,102,.35); color:var(--success);",
  Expiring: "background:rgba(245,158,11,.12); border:1px solid rgba(245,158,11,.35); color:var(--warn);",
  Expired: "background:rgba(239,68,68,.12); border:1px solid rgba(239,68,68,.35); color:var(--danger);",
  Renewed: "background:rgba(59,130,246,.12); border:1px solid rgba(59,130,246,.35); color:var(--blue);",
  Cancelled: "background:rgba(255,255,255,.05); border:1px solid var(--line2); color:var(--muted);",
}[s] || "");
export const clStatusPill = (s: string) => ({
  Active: "background:rgba(37,211,102,.12); border:1px solid rgba(37,211,102,.35); color:var(--success);",
  Trial: "background:rgba(230,36,41,.12); border:1px solid rgba(230,36,41,.35); color:var(--red2);",
  Paused: "background:rgba(245,158,11,.12); border:1px solid rgba(245,158,11,.35); color:var(--warn);",
  Inactive: "background:rgba(255,255,255,.04); border:1px solid var(--line2); color:var(--muted);",
}[s] || "");
export const coachStatusStyle = (k: string) => ({
  live: "background:rgba(37,211,102,.12); border:1px solid rgba(37,211,102,.35); color:var(--success);",
  break: "background:rgba(245,158,11,.12); border:1px solid rgba(245,158,11,.35); color:var(--warn);",
  later: "background:rgba(255,255,255,.05); border:1px solid var(--line2); color:var(--muted2);",
  off: "background:rgba(255,255,255,.03); border:1px solid var(--line); color:var(--muted);",
}[k] || "");
export const leadAction = (st: string) => ({ New: "Assign to group", "Trial booked": "Mark trial done", "Trial done": "Subscribe", Won: "", Lost: "" }[st] || "");
export const leadActionStyle = (st: string) => ({
  New: "background:linear-gradient(135deg,var(--red),var(--red2)); color:#fff; border:0;",
  "Trial booked": "background:transparent; color:var(--warn); border:1px solid rgba(245,158,11,.5);",
  "Trial done": "background:linear-gradient(135deg,#059669,#25d366); color:#fff; border:0;",
}[st] || "");
export const STAGES = ["New", "Trial booked", "Trial done", "Won", "Lost"];
export const STAGE_META: Record<string, string> = { New: "var(--muted2)", "Trial booked": "var(--red2)", "Trial done": "var(--warn)", Won: "var(--success)", Lost: "var(--muted)" };
export const STAGE_PILL_BG: Record<string, string> = { New: "rgba(255,255,255,.05)", "Trial booked": "rgba(255,79,84,.14)", "Trial done": "rgba(245,158,11,.14)", Won: "rgba(37,211,102,.14)", Lost: "rgba(255,255,255,.04)" };
export const kindStyle = (k: string) => k === "Recurring"
  ? "background:rgba(230,36,41,.12); border:1px solid rgba(230,36,41,.4); color:var(--red2);"
  : "background:rgba(255,255,255,.05); border:1px solid var(--line2); color:var(--muted2);";
