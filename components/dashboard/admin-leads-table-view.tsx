"use client";

import { ArrowRight, Phone, Search, TriangleAlert, UserRoundX, X } from "lucide-react";
import { useMemo, useState } from "react";

import { formatPhoneNumber } from "@/lib/phone-format";
import type { MarvelOpsLead } from "./marvel-ops-admin-view";
import s from "./admin-leads-table-view.module.css";

// ─── stage metadata ───────────────────────────────────────────────────────────

const stages = ["New", "Trial booked", "Trial done", "Won", "Lost"] as const;
type Stage = (typeof stages)[number];

const STAGE_COLOR: Record<Stage, string> = {
  New: "#c4c4c4",
  "Trial booked": "#ff4f54",
  "Trial done": "#f59e0b",
  Won: "#25d366",
  Lost: "#ef4444",
};
const STAGE_PILL_BG: Record<Stage, string> = {
  New: "rgba(196,196,196,.12)",
  "Trial booked": "rgba(230,36,41,.12)",
  "Trial done": "rgba(245,158,11,.12)",
  Won: "rgba(37,211,102,.12)",
  Lost: "rgba(239,68,68,.12)",
};
const STAGE_SECTION_BG: Partial<Record<Stage, string>> = {
  Won: "rgba(37,211,102,.07)",
  Lost: "rgba(239,68,68,.07)",
};
const NEXT_STEP_DEFAULT: Record<Stage, string> = {
  New: "Needs first contact",
  "Trial booked": "Awaiting trial",
  "Trial done": "Awaiting decision",
  Won: "Subscribed",
  Lost: "Chose elsewhere",
};

// ─── avatar gradient by tone ──────────────────────────────────────────────────

const TONE_GRAD: Record<string, string> = {
  red: "linear-gradient(135deg,#e62429,#ff4f54)",
  green: "linear-gradient(135deg,#25d366,#14b8a6)",
  violet: "linear-gradient(135deg,#8b5cf6,#ec4899)",
  blue: "linear-gradient(135deg,#3b82f6,#8b5cf6)",
  amber: "linear-gradient(135deg,#f59e0b,#ff6b35)",
  teal: "linear-gradient(135deg,#14b8a6,#3b82f6)",
};

// ─── sort helpers ─────────────────────────────────────────────────────────────

type SortKey = "name" | "source" | "stage";
const STAGE_ORDER: Record<Stage, number> = { New: 0, "Trial booked": 1, "Trial done": 2, Won: 3, Lost: 4 };

function compare(a: MarvelOpsLead, b: MarvelOpsLead, key: SortKey): number {
  if (key === "stage") return STAGE_ORDER[a.stage] - STAGE_ORDER[b.stage];
  if (key === "name") return a.name.localeCompare(b.name);
  if (key === "source") return a.source.localeCompare(b.source);
  return 0;
}

const ARR: Record<"asc" | "desc", string> = { asc: " ↑", desc: " ↓" };

// ─── props ────────────────────────────────────────────────────────────────────

interface Props {
  leads: MarvelOpsLead[];
  pending: boolean;
  onAdd: () => void;
  onProgress: (lead: MarvelOpsLead) => void;
  onDelete: (lead: MarvelOpsLead) => void;
  onMarkLost: (lead: MarvelOpsLead) => void;
}

// ─── component ────────────────────────────────────────────────────────────────

export function AdminLeadsTableView({ leads, pending, onAdd, onProgress, onDelete, onMarkLost }: Props) {
  const [stageFilter, setStageFilter] = useState<Stage | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("stage");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  // filter
  const filtered = useMemo(
    () => leads.filter((l) => !stageFilter || l.stage === stageFilter),
    [leads, stageFilter],
  );

  // sort
  const rows = useMemo(
    () => [...filtered].sort((a, b) => (sortDir === "asc" ? compare(a, b, sortKey) : -compare(a, b, sortKey))),
    [filtered, sortKey, sortDir],
  );

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  }
  function toggleStage(stage: Stage) {
    setStageFilter((prev) => (prev === stage ? null : stage));
  }

  function sortLabel(key: SortKey) {
    return sortKey === key ? ARR[sortDir] : "";
  }

  const ACTIONS: Partial<Record<Stage, string>> = {
    New: "Assign to group",
    "Trial booked": "Mark trial done",
    "Trial done": "Subscribe",
  };

  return (
    <div className={s.wrap}>
      {/* ── top row ── */}
      <div className={s.topRow}>
        {/* stage strip */}
        <div className={s.strip}>
          {stages.map((stage) => {
            const count = leads.filter((l) => l.stage === stage).length;
            const active = stageFilter === stage;
            return (
              <button
                key={stage}
                className={s.stripBtn}
                style={{ background: active ? STAGE_PILL_BG[stage] : (STAGE_SECTION_BG[stage] ?? "transparent") }}
                onClick={() => toggleStage(stage)}
                type="button"
              >
                <span className={s.stripLabel}>
                  <span className={s.stripDot} style={{ background: STAGE_COLOR[stage] }} />
                  <span className={`${s.stripName} ${active ? s.stripNameActive : ""}`}>{stage}</span>
                </span>
                <span className={s.stripCount} style={{ color: active ? STAGE_COLOR[stage] : "#fff" }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* add */}
        <button className={s.addBtn} onClick={onAdd} type="button">+ Add lead</button>
      </div>

      {/* ── table ── */}
      <div className={s.tableScroll}>
        <div className={s.table}>
          {/* head */}
          <div className={s.head}>
            <span />
            <button className={`${s.sortBtn} ${s.sortBtnLead}`} onClick={() => toggleSort("name")} type="button">
              Lead{sortLabel("name")}
            </button>
            <button className={s.sortBtn} onClick={() => toggleSort("source")} type="button">
              Source{sortLabel("source")}
            </button>
            <span className={s.colLabel}>Phone</span>
            <button className={s.sortBtn} onClick={() => toggleSort("stage")} type="button">
              Stage{sortLabel("stage")}
            </button>
            <span className={s.colLabel}>Next step</span>
            <span className={`${s.colLabel} ${s.actionLabel}`}>Action</span>
            <span />
          </div>

          {/* empty */}
          {rows.length === 0 && (
            <div className={s.empty}>
              <Search size={30} />
              <h2>No leads found</h2>
              <p>Change the stage filter or add a new lead.</p>
            </div>
          )}

          {/* rows */}
          {rows.map((lead) => {
            const stageColor = STAGE_COLOR[lead.stage];
            const hasToday = /today/i.test(lead.assigned ?? "");
            const nextStep = lead.assigned || NEXT_STEP_DEFAULT[lead.stage];
            const showLostReason = lead.stage === "Lost" && Boolean(lead.lostReason?.trim());
            const nextStepTone = hasToday
              ? s.nextStepUrgent
              : lead.stage === "New"
                ? s.nextStepNew
                : "";
            const action = ACTIONS[lead.stage];

            return (
              <div
                key={lead.id}
                className={s.row}
                data-stage={lead.stage}
              >
                {/* accent bar */}
                <span className={s.accent} style={{ background: stageColor }} />

                {/* lead cell */}
                <div className={s.leadCell}>
                  <span
                    className={s.avatar}
                    style={{ background: TONE_GRAD[lead.tone] ?? TONE_GRAD.red }}
                  >
                    {lead.initials}
                  </span>
                  <div className={s.minCol}>
                    <div className={s.name}>{lead.name}</div>
                    <div className={`${s.note} ${showLostReason ? s.lostReason : ""}`}>
                      {showLostReason ? `Lost · ${lead.lostReason}` : (lead.note || "—")}
                    </div>
                  </div>
                  {lead.injury && (
                    <span className={s.warnIcon} title={lead.injury}>
                      <TriangleAlert size={13} />
                    </span>
                  )}
                </div>

                {/* source */}
                <div className={s.pad}>
                  <span className={s.sourcePill} data-source={lead.source}>{lead.source}</span>
                </div>

                {/* phone */}
                <div className={s.pad}>
                  <span className={s.phone}>
                    <span className={s.phoneIcon}><Phone size={12} aria-hidden="true" /></span>
                    {formatPhoneNumber(lead.phone)}
                  </span>
                </div>

                {/* stage pill */}
                <div className={s.pad}>
                  <span
                    className={s.stagePill}
                    style={{ color: stageColor }}
                  >
                    {lead.stage}
                  </span>
                </div>

                {/* next step */}
                {lead.stage === "Lost" ? (
                  <div className={`${s.pad} ${s.nextStepCell}`} aria-hidden="true" />
                ) : (
                  <div className={`${s.pad} ${s.nextStepCell}`} title={nextStep}>
                    <span className={`${s.nextStepDot} ${nextStepTone}`} aria-hidden="true" />
                    <span className={`${s.nextStep} ${nextStepTone}`}>{nextStep}</span>
                  </div>
                )}

                {/* action */}
                <div className={s.actionPad}>
                  {action ? (
                    <button
                      className={s.actionBtn}
                      disabled={pending}
                      onClick={() => onProgress(lead)}
                      type="button"
                    >
                      <span>{action}</span>
                      {action === "Subscribe" ? null : <ArrowRight size={13} aria-hidden="true" />}
                    </button>
                  ) : null}
                </div>

                {/* row actions */}
                <div className={s.rowTools}>
                  {lead.stage !== "Won" && lead.stage !== "Lost" ? (
                    <button
                      className={s.delBtn}
                      aria-label={`Mark ${lead.name} as lost`}
                      title={`Mark ${lead.name} as lost`}
                      disabled={pending}
                      onClick={() => onMarkLost(lead)}
                      type="button"
                    >
                      <UserRoundX size={14} aria-hidden="true" />
                    </button>
                  ) : null}
                  <button
                    className={s.delBtn}
                    aria-label={`Delete ${lead.name}`}
                    title={`Delete ${lead.name}`}
                    disabled={pending}
                    onClick={() => onDelete(lead)}
                    type="button"
                  >
                    <X size={14} aria-hidden="true" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
