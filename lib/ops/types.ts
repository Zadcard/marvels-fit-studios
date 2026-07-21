// Shared domain types for the operations app.
// The prototype used positional arrays for some records; here they're named
// objects so the data reads cleanly and is API-swap friendly.

export type Role = "admin" | "coach";
export type GradKey = "red" | "blue" | "violet" | "amber" | "green" | "teal" | "slate";
export type AttState = "none" | "present" | "late" | "absent" | "noshow";
export type SessionState = "done" | "live" | "upcoming";

export interface Coach {
  id: string;
  name: string;
  initials: string;
  role: string;
  cats: string;
  grad: string;        // resolved CSS gradient
  active?: boolean;
}

export interface RosterMember {
  id: string;
  name: string;
  injury: string;
  isTrial: boolean;
  meta: string;
}

export interface Session {
  id: string;
  time: string;
  dur: string;
  category: string;
  type: "Group" | "Private";
  coachId: string;
  location: string;
  state: SessionState;
  roster: RosterMember[];
}

// Positional-tuple record types (kept to mirror the prototype's data exactly).
export type LeadRow = [
  stage: string, name: string, initials: string, grad: GradKey,
  source: string, phone: string, wants: string, note: string, assigned: string,
];
export type ClientRow = [
  name: string, initials: string, grad: GradKey, category: string, type: string,
  coachId: string, status: string, phone: string, injury: string,
];
export type SubRow = [
  name: string, initials: string, grad: GradKey, plan: string, amount: number,
  method: string, status: string, expiry: string, due: string, bundle: number, used: number,
];

export interface Plan { name: string; detail: string; price: string; }
export interface CashOut { label: string; cat: string; amount: string; method: string; date: string; }

export interface ClientProfile {
  joined: string; plan: string; bundle: number; used: number; streak: number;
  attRate: number; days: string; injuryHist: string[]; history: string[];
}

export interface Toast { id: string; msg: string; kind: "ok" | "warn"; }
export interface ConfirmReq { title: string; body: string; }

export interface Account { pw: string; role: Role; }
