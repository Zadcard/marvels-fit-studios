import "server-only";

import { adminAttendanceRepository } from "@/lib/repositories/admin-attendance-repository";
import { adminClientRepository } from "@/lib/repositories/admin-client-repository";
import { adminCoachRepository } from "@/lib/repositories/admin-coach-repository";
import { adminGroupRepository } from "@/lib/repositories/admin-group-repository";
import { adminLeadRepository } from "@/lib/repositories/admin-lead-repository";
import { adminReportRepository } from "@/lib/repositories/admin-report-repository";
import { adminScheduleRepository } from "@/lib/repositories/admin-schedule-repository";
import { adminSettingsRepository } from "@/lib/repositories/admin-settings-repository";
import { adminSubscriptionRepository } from "@/lib/repositories/admin-subscription-repository";
import { AdminTrainingCategoryRepository } from "@/lib/repositories/admin-training-category-repository";
import { adminTodayOperationsRepository } from "@/lib/repositories/admin-today-operations-repository";
import { listNotifications } from "@/lib/repositories/notification-repository";
import type { AdminScheduleSessionRecord } from "@/lib/dashboard/admin-schedule-data";
import { resolveReportRange } from "@/lib/reports/report-range";
import {
  STUDIO_TIME_ZONE,
  getStudioDateKey,
} from "@/lib/time/studio-time";

import { GRADS } from "./data";
import type { NotifRow, SchedCell } from "./data";
import type {
  AttState,
  ClientProfile,
  ClientRow,
  Coach,
  LeadRow,
  Session,
  SubRow,
} from "./types";
import {
  gradKeyFor,
  initialsOf,
  mockOpsData,
  type OpsChangeRequest,
  type OpsData,
  type OpsMethodSplit,
  type OpsRenewal,
  type OpsTrialToday,
} from "./live";

const WEEK_DAYS = ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"];

const egp = (n: number) => "EGP " + Math.round(n).toLocaleString("en-US");
const egpK = (n: number) => "EGP " + Math.round(n / 1000) + "k";

const timeFmt = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
  timeZone: STUDIO_TIME_ZONE,
});
const dayShortFmt = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  timeZone: STUDIO_TIME_ZONE,
});
const dateLongFmt = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: STUDIO_TIME_ZONE,
});
const nowLabelFmt = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
  timeZone: STUDIO_TIME_ZONE,
});

function dueLabel(days: number) {
  if (days < 0) return Math.abs(days) + (days === -1 ? " day ago" : " days ago");
  if (days === 0) return "today";
  return days + (days === 1 ? " day" : " days");
}

function shortCategory(value: string) {
  return value
    .replace(" Conditioning", " Cond.")
    .replace(" Class", "")
    .trim();
}

// Attendance labels from the backend → the prototype's tap states.
function attStateFor(status: string): AttState {
  switch (status) {
    case "Attended":
      return "present";
    case "Absent":
      return "absent";
    case "No-show":
      return "noshow";
    default:
      return "none";
  }
}

function sessionState(startsAt: string, endsAt: string, now: Date): Session["state"] {
  const start = new Date(startsAt).getTime();
  const end = new Date(endsAt).getTime();
  if (now.getTime() >= end) return "done";
  if (now.getTime() >= start) return "live";
  return "upcoming";
}

function durationLabel(startsAt: string, endsAt: string) {
  const minutes = Math.max(
    0,
    Math.round((new Date(endsAt).getTime() - new Date(startsAt).getTime()) / 60_000),
  );
  return `${minutes || 60} MIN`;
}

/**
 * Queries the existing admin repositories and reshapes their records into the
 * OpsData contract the ops UI store consumes. Every dataset that the prototype
 * mocked now comes from Supabase; anything the schema cannot answer yet stays
 * an empty list rather than fake numbers.
 */
export async function loadOpsData(): Promise<OpsData> {
  const now = new Date();
  const todayKey = getStudioDateKey(now);

  const [
    coachData,
    todayOps,
    attendanceSessions,
    schedule,
    changeRequests,
    subscriptionData,
    groupData,
    leadData,
    clientData,
    settings,
    categoryOptions,
  ] = await Promise.all([
    adminCoachRepository.list(),
    adminTodayOperationsRepository.getToday(),
    adminAttendanceRepository.getToday(),
    adminScheduleRepository.getSchedule(),
    adminScheduleRepository.getPendingChangeRequests(),
    adminSubscriptionRepository.list(),
    adminGroupRepository.list(),
    adminLeadRepository.list(),
    adminClientRepository.list(),
    adminSettingsRepository.get(),
    new AdminTrainingCategoryRepository().options({ activeOnly: true }),
  ]);

  const coachRecords = coachData.records;

  const monthStartKey = todayKey.slice(0, 8) + "01";
  const report = await adminReportRepository
    .getReport(
      resolveReportRange({ from: monthStartKey, to: todayKey }, STUDIO_TIME_ZONE, now),
    )
    .catch(() => null);

  // ── coaches ──
  const coaches: Coach[] = coachRecords.map((coach) => ({
    id: coach.id,
    name: coach.fullName,
    initials: initialsOf(coach.fullName),
    role: coach.specialization ?? "Coach",
    cats: coach.qualifiedCategories.map((category) => category.name).join(", ") || "No categories",
    grad: GRADS[gradKeyFor(coach.fullName)],
    active: true,
  }));
  const coachIdByName = new Map(coachRecords.map((coach) => [coach.fullName, coach.id]));
  const coachEmails = Object.fromEntries(
    coachRecords.map((coach) => [coach.id, coach.email]),
  );

  const coachStatus: OpsData["coachStatus"] = {};
  for (const coach of todayOps.coaches) {
    coachStatus[coach.id] = {
      now: coach.detail,
      status: coach.status,
      k: (coach.status as string) === "On floor" || (coach.status as string) === "Live" ? "live" : coach.status === "Later" ? "later" : "off",
    };
  }
  for (const coach of coachRecords) {
    if (!coachStatus[coach.id]) {
      coachStatus[coach.id] = { now: "No sessions today", status: "No sessions", k: "off" };
    }
  }

  const coachSlots: OpsData["coachSlots"] = {};
  for (const coach of coachRecords) {
    const todayCount = coach.sessionsToday;
    coachSlots[coach.id] = {
      blocks: coach.weeklyLoad.map((day) => [day.day, day.sessions]),
      today: todayCount > 0 ? `${todayCount} session${todayCount === 1 ? "" : "s"} today` : "No sessions today",
      week: coach.sessionsThisWeek,
      clients: coach.activeClients,
    };
  }

  // ── today's sessions (schedule times + attendance roster) ──
  const todayScheduleById = new Map<string, AdminScheduleSessionRecord>(
    schedule.records
      .filter((record) => record.dayKey === todayKey)
      .map((record) => [record.id, record]),
  );
  const initialAtt: OpsData["initialAtt"] = {};
  const todaySessions: Session[] = attendanceSessions.map((session) => {
    const sched = todayScheduleById.get(session.id);
    const state = sched
      ? sessionState(sched.startsAt, sched.endsAt, now)
      : ("upcoming" as const);
    const att: Record<string, AttState> = {};
    for (const attendee of session.attendees) {
      const mapped = attStateFor(attendee.status);
      if (mapped !== "none") att[attendee.clientId] = mapped;
    }
    if (Object.keys(att).length > 0) initialAtt[session.id] = att;
    return {
      id: session.id,
      time: session.timeLabel,
      dur: sched ? durationLabel(sched.startsAt, sched.endsAt) : "60 MIN",
      category: session.trainingCategory ?? session.title,
      type: session.sessionType,
      coachId: coachIdByName.get(session.coachName) ?? "",
      location: sched?.groupName || session.title,
      state,
      roster: session.attendees.map((attendee) => ({
        id: attendee.clientId,
        name: attendee.fullName,
        injury: attendee.hasInjuryAlert ? attendee.injuryNotes || attendee.injuryStatus : "",
        isTrial: attendee.isTrial,
        meta: attendee.isTrial ? "Trial" : "Member",
      })),
    };
  });

  // ── week grid ──
  const rowsByTime = new Map<string, { time: string; startMs: number; cells: (SchedCell | null)[] }>();
  for (const record of schedule.records) {
    const start = new Date(record.startsAt);
    const timeLabel = timeFmt.format(start);
    const dayIndex = WEEK_DAYS.indexOf(dayShortFmt.format(start));
    if (dayIndex < 0) continue;
    let row = rowsByTime.get(timeLabel);
    if (!row) {
      row = { time: timeLabel, startMs: start.getTime() % 86_400_000, cells: WEEK_DAYS.map(() => null) };
      rowsByTime.set(timeLabel, row);
    }
    row.cells[dayIndex] = {
      cat: shortCategory(record.trainingCategory ?? record.title),
      coach: record.coachId,
      priv: record.sessionType === "Private",
      today: record.dayKey === todayKey,
      live:
        record.dayKey === todayKey &&
        sessionState(record.startsAt, record.endsAt, now) === "live",
    };
  }
  const minutesOf = (label: string) => {
    const match = /(\d+):(\d+)\s*(AM|PM)/i.exec(label);
    if (!match) return 0;
    const hour = (Number(match[1]) % 12) + (match[3].toUpperCase() === "PM" ? 12 : 0);
    return hour * 60 + Number(match[2]);
  };
  const schedRows = [...rowsByTime.values()]
    .sort((a, b) => minutesOf(a.time) - minutesOf(b.time))
    .map(({ time, cells }) => ({ time, cells }));

  // ── change requests ──
  const scheduleChanges: OpsChangeRequest[] = changeRequests.map((request) => ({
    id: request.id,
    name: request.clientName,
    initials: initialsOf(request.clientName),
    gradKey: gradKeyFor(request.clientName),
    kind: request.kindLabel === "Recurring" ? "Recurring" : "One session",
    detail: request.description,
    reason: request.reason,
  }));

  // ── subscriptions ──
  const subsRaw: SubRow[] = [];
  const subMeta: OpsData["subMeta"] = {};
  for (const record of subscriptionData.records) {
    const statusLabel =
      record.subscriptionStatus === "Pending renewal"
        ? "Expiring"
        : record.subscriptionStatus === "Canceled"
          ? "Cancelled"
          : record.subscriptionStatus === "Paused"
            ? "Expired"
            : record.subscriptionStatus;
    const renews = record.renewalDateValue ? new Date(record.renewalDateValue) : null;
    const days = renews
      ? Math.ceil((renews.getTime() - now.getTime()) / 86_400_000)
      : 0;
    const planShort = record.planName
      .replace(" Membership", "")
      .replace(" Coaching", "")
      .replace(" Elite", "")
      .replace(" Reset", "");
    subsRaw.push([
      record.memberName,
      initialsOf(record.memberName),
      gradKeyFor(record.memberName),
      planShort,
      Math.round(Number(record.amountValue) || 0),
      record.paymentHistory[0]?.method ?? "Cash",
      statusLabel,
      record.renewalDate,
      renews ? (days >= 0 ? "in " + dueLabel(days) : dueLabel(days)) : "—",
      record.sessionsTotal ?? 0,
      Math.max(0, (record.sessionsTotal ?? 0) - (record.sessionsLeft ?? 0)),
    ]);
    subMeta[record.memberName] = {
      subscriptionId: record.id,
      clientId: record.clientId,
      planId: record.planId,
      renewalDate: record.renewalDateValue,
      subscriptionStatus: record.subscriptionStatus,
      paymentStatus: record.paymentStatus,
    };
  }

  // ── cash ledger (today in, month out) ──
  const cashRows: OpsData["cashRows"] = todayOps.recentPayments.map((payment) => [
    "in",
    payment.description,
    "",
    "+" + payment.amountLabel.replace(/[^\d,]/g, ""),
    payment.timeLabel,
  ]);
  for (const expense of (report?.recentExpenses ?? []).slice(0, 4)) {
    if (expense.status !== "POSTED") continue;
    cashRows.push([
      "out",
      expense.description,
      expense.methodLabel,
      "−" + Math.round(expense.amount).toLocaleString("en-US"),
      expense.occurredAtLabel,
    ]);
  }

  // ── leads ──
  const leadStageFor: Record<string, string> = {
    New: "New",
    Contacted: "Trial booked",
    "Trial done": "Trial done",
    Converted: "Won",
    Closed: "Lost",
  };
  const groupNameById = new Map(groupData.records.map((group) => [group.id, group.name]));
  const leadsRaw: LeadRow[] = [];
  const leadIds: Record<string, string> = {};
  for (const lead of leadData.records) {
    leadsRaw.push([
      leadStageFor[lead.status] ?? "New",
      lead.fullName,
      initialsOf(lead.fullName),
      gradKeyFor(lead.fullName),
      lead.source || "Other",
      lead.phone || "—",
      lead.interestedCategory ?? "General fitness",
      lead.message || lead.preferredAvailability || "",
      lead.trialGroupId ? (groupNameById.get(lead.trialGroupId) ?? "Trial booked") : "",
    ]);
    leadIds[lead.fullName] = lead.id;
  }

  // ── groups ──
  const activeCategoryIds = new Set(categoryOptions.map((category) => category.id));
  const activeGroupRecords = groupData.records.filter(
    (group) => group.isActive && activeCategoryIds.has(group.categoryId),
  );
  const groupsRaw: OpsData["groupsRaw"] = activeGroupRecords.map((group) => [
    group.name,
    group.coachId,
    group.scheduleSummary || "Set schedule",
    group.series?.slots?.[0]?.localStartTime ?? "—",
    group.categoryName,
    group.memberCount,
  ]);
  const groupIds = Object.fromEntries(activeGroupRecords.map((group) => [group.name, group.id]));
  const categoryIds = Object.fromEntries(categoryOptions.map((category) => [category.name, category.id]));

  // ── clients ──
  const clientsRaw: ClientRow[] = [];
  const clientMeta: OpsData["clientMeta"] = {};
  const clientProfiles: Record<string, ClientProfile> = {};
  for (const client of clientData.records) {
    const statusLabel =
      client.status === "Did not continue" || client.status === "Pending"
        ? "Inactive"
        : client.status;
    clientsRaw.push([
      client.fullName,
      initialsOf(client.fullName),
      gradKeyFor(client.fullName),
      client.trainingCategory,
      client.membership === "Private Coaching" ? "Private" : "Group",
      coachIdByName.get(client.assignedCoach) ?? "",
      statusLabel,
      client.phone || "—",
      client.hasInjuryAlert ? client.injuryNotes || client.injuryStatus : "",
    ]);
    clientMeta[client.fullName] = {
      clientId: client.id,
      email: client.email,
      paymentStatus: client.paymentStatus,
      groupId: client.primaryGroupId,
    };
    const used = Math.max(0, client.sessionsTotal - client.sessionsLeft);
    clientProfiles[client.fullName] = {
      joined: client.joinedDate,
      plan: client.membership,
      bundle: client.sessionsTotal,
      used,
      streak: 0,
      attRate: client.sessionsTotal
        ? Math.round((used / client.sessionsTotal) * 100)
        : 0,
      days: client.nextSession || "No upcoming session",
      injuryHist: [client.injuryNotes, client.restrictions].filter(
        (entry): entry is string => Boolean(entry && entry.trim()),
      ),
      history: [
        client.progressNote,
        ...client.nextSessions.slice(0, 2),
        ...client.receipts
          .slice(0, 2)
          .map((receipt) => `Paid ${receipt.amountLabel} · ${receipt.dateLabel} (${receipt.method})`),
      ].filter((entry): entry is string => Boolean(entry && entry.trim())),
    };
  }

  // ── today panels ──
  const trialsToday: OpsTrialToday[] = todayOps.trials.map((trial) => ({
    leadId: trial.id,
    name: trial.fullName,
    initials: trial.initials,
    gradKey: gradKeyFor(trial.fullName),
    time: "Today",
    category: trial.groupName,
    type: "Group trial",
    source: trial.phone,
  }));
  const renewSoon: OpsRenewal[] = todayOps.renewals.map((renewal) => {
    const match = /in (\d+) day/.exec(renewal.dueLabel);
    return {
      subscriptionId: renewal.id,
      name: renewal.fullName,
      initials: renewal.initials,
      gradKey: gradKeyFor(renewal.fullName),
      plan: renewal.planName,
      amount: renewal.amountLabel,
      method: renewal.methodLabel ?? "—",
      due: renewal.dueLabel.replace(/^in /, ""),
      days: match ? Number(match[1]) : 0,
    };
  });

  const methodTotal = (report?.paymentMethods ?? []).reduce(
    (sum, method) => sum + method.amount,
    0,
  );
  const methodsToday: OpsMethodSplit[] = (report?.paymentMethods ?? []).map((method) => ({
    label: method.label,
    value: egp(method.amount),
    pct: methodTotal ? Math.round((method.amount / methodTotal) * 100) + "%" : "0%",
  }));

  // ── report bundle ──
  const stageCount = (stages: string[]) =>
    leadsRaw.filter((lead) => stages.includes(lead[0])).length;
  const funnelBase = leadsRaw.length || 1;
  const funnelRows = [
    { label: "Leads", count: leadsRaw.length },
    { label: "Trials booked", count: stageCount(["Trial booked", "Trial done", "Won"]) },
    { label: "Trials done", count: stageCount(["Trial done", "Won"]) },
    { label: "Subscribed", count: stageCount(["Won"]) },
  ].map((row) => ({ ...row, pct: Math.round((row.count / funnelBase) * 100) + "%" }));

  const attByCategory = new Map<string, { attended: number; total: number }>();
  for (const record of schedule.records) {
    const key = record.trainingCategory ?? record.title;
    const entry = attByCategory.get(key) ?? { attended: 0, total: 0 };
    for (const booked of record.bookedClients) {
      entry.total += 1;
      if (booked.status === "ATTENDED") entry.attended += 1;
    }
    attByCategory.set(key, entry);
  }
  const attCats = [...attByCategory.entries()]
    .filter(([, entry]) => entry.total > 0)
    .map(([label, entry]) => ({
      label,
      pct: Math.round((entry.attended / entry.total) * 100) + "%",
    }))
    .slice(0, 5);

  const weeklyRev = new Map<string, number>();
  for (const point of report?.daily ?? []) {
    const week = "W" + Math.min(5, Math.trunc((Number(point.date.slice(8, 10)) - 1) / 7) + 1);
    weeklyRev.set(week, (weeklyRev.get(week) ?? 0) + point.income);
  }
  const revData = [...weeklyRev.entries()].map(([m, v]) => ({
    m,
    v: Math.round(v / 1000),
  }));

  const utilVals = Object.fromEntries(
    (report?.coaches ?? []).map((coach) => [coach.id, coach.attendedSeats]),
  );

  const recentOut = (report?.recentExpenses ?? [])
    .filter((expense) => expense.status === "POSTED")
    .slice(0, 6)
    .map((expense) => ({
      label: expense.description,
      cat: expense.categoryLabel,
      amount: egp(expense.amount),
      method: expense.methodLabel,
      date: expense.occurredAtLabel,
    }));

  // ── notifications (studio automation writes per-recipient rows) ──
  let notifRaw: NotifRow[] = [];
  try {
    const { requireUser } = await import("@/lib/auth/session");
    const user = await requireUser();
    const rows = await listNotifications(user.id);
    const kindType = (kind: string) => {
      const normalized = kind.toLowerCase();
      if (normalized.includes("injur")) return "injury";
      if (normalized.includes("pay") || normalized.includes("renew") || normalized.includes("subscription")) return "money";
      if (normalized.includes("schedule") || normalized.includes("session")) return "schedule";
      if (normalized.includes("lead") || normalized.includes("trial")) return "lead";
      return "member";
    };
    const dayMs = 86_400_000;
    notifRaw = rows.map((row) => {
      const sent = row.sentAt ? new Date(row.sentAt) : now;
      const age = now.getTime() - sent.getTime();
      return {
        g: age < dayMs ? "Today" : age < 2 * dayMs ? "Yesterday" : "Earlier",
        type: kindType(row.kind ?? ""),
        title: row.title,
        detail: row.body ?? "",
        time:
          age < dayMs
            ? Math.max(1, Math.round(age / 3_600_000)) + "h"
            : dayShortFmt.format(sent),
        unread: !row.readAt,
        action: row.href ? "View" : undefined,
      };
    });
  } catch {
    notifRaw = [];
  }

  // ── headline numbers ──
  const expiring = subsRaw.filter((row) => row[6] === "Expiring");
  const cashOutToday = (report?.recentExpenses ?? [])
    .filter(
      (expense) =>
        expense.status === "POSTED" &&
        expense.occurredAtLabel === (report?.recentExpenses?.[0]?.occurredAtLabel ?? ""),
    )
    .reduce((sum, expense) => sum + expense.amount, 0);

  return {
    ...mockOpsData(),
    coaches,
    coachStatus,
    coachSlots,
    coachEmails,
    todaySessions,
    initialAtt,
    subsRaw,
    subMeta,
    cashRows,
    leadsRaw,
    leadIds,
    injuryByLead: {},
    groupsRaw,
    groupIds,
    categoryIds,
    clientsRaw,
    clientMeta,
    clientProfiles,
    notifRaw,
    schedRows,
    trialsToday,
    renewSoon,
    methodsToday,
    scheduleChanges,
    recentOut,
    basePlans: subscriptionData.planOptions.map((plan) => ({
      name: plan.label,
      detail: "Subscription plan",
      price: plan.amountLabel,
    })),
    planIds: Object.fromEntries(
      subscriptionData.planOptions.map((plan) => [plan.label, plan.id]),
    ),
    setFields: [
      { label: "Studio name", value: settings.studioName, span: "grid-column:1 / -1;" },
      { label: "Support email", value: settings.supportEmail, span: "" },
      { label: "Phone", value: settings.supportPhone, span: "" },
      { label: "Timezone", value: settings.timezone, span: "" },
      { label: "Week starts on", value: settings.scheduleStartDay, span: "" },
    ],
    report: {
      kpis: [
        { label: "Revenue", value: egpK(report?.summary.income ?? 0), delta: "" },
        { label: "Payments", value: String(report?.summary.paymentCount ?? 0), delta: "" },
        { label: "Expenses", value: egpK(report?.summary.expenses ?? 0), delta: "" },
        {
          label: "Avg attendance",
          value: (report?.summary.attendanceRate ?? 0) + "%",
          delta: "",
        },
      ],
      revData: revData.length ? revData : [{ m: "W1", v: 0 }],
      utilVals,
      attCats,
      funnel: funnelRows,
      cashInMonth: egp(report?.summary.income ?? 0),
      cashOutMonth: egp(report?.summary.expenses ?? 0),
      cashNetMonth: egp(report?.summary.net ?? 0),
      periodLabel: report ? `${report.range.from} – ${report.range.to}` : "This month",
    },
    headline: {
      cashIn: todayOps.cashTodayLabel,
      cashOut: egp(cashOutToday),
      cashTodayNet: todayOps.cashTodayLabel,
      cashTodayCount: todayOps.cashTodayCount,
      expiringCount: expiring.length,
      expiringValue: egp(expiring.reduce((sum, row) => sum + row[4], 0)),
    },
    dateLong: dateLongFmt
      .format(now)
      .replace(", ", " · ")
      .replace(",", ""),
    nowLabel: nowLabelFmt.format(now).replaceAll(",", " ·"),
  };
}
