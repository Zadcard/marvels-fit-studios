"use client";

import { ArrowRight, MessageCircle, Phone, Search, TriangleAlert, UserRoundX, X } from "lucide-react";
import { useMemo, useState } from "react";

import { formatPhoneNumber } from "@/lib/phone-format";
import type { MarvelOpsLead } from "./marvel-ops-admin-view";
import s from "./admin-leads-table-view.module.css";

// ─── stage metadata ───────────────────────────────────────────────────────────

const stages = ["New", "Trial booked", "Trial done", "Won", "Lost"] as const;
type Stage = (typeof stages)[number];

const STAGE_COLOR: Record<Stage, string> = {
  New: "#38bdf8",
  "Trial booked": "#a855f7",
  "Trial done": "#f59e0b",
  Won: "#25d366",
  Lost: "#ef4444",
};
const STAGE_PILL_BG: Record<Stage, string> = {
  New: "rgba(56,189,248,.12)",
  "Trial booked": "rgba(168,85,247,.12)",
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
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("stage");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  // KPI Calculations
  const totalLeads = leads.length;
  const wonCount = leads.filter((l) => l.stage === "Won").length;
  const newCount = leads.filter((l) => l.stage === "New").length;
  const needsActionCount = leads.filter((l) => l.stage === "New" || Boolean(l.injury)).length;
  const conversionRate = totalLeads > 0 ? Math.round((wonCount / totalLeads) * 100) : 0;

  const cleanPhone = (phone: string) => (phone || "").replace(/\D/g, "");

  // filter
  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return leads.filter((l) => {
      const matchesStage = !stageFilter || l.stage === stageFilter;
      const matchesQuery =
        !q ||
        [l.name, l.phone, l.source, l.wants, l.note, l.assigned]
          .some((val) => val?.toLowerCase().includes(q));
      return matchesStage && matchesQuery;
    });
  }, [leads, stageFilter, searchQuery]);

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
      {/* ── KPI Overview Header ── */}
      <div className={s.kpiGrid}>
        <div className={s.kpiTile}>
          <span className={s.kpiLabel}>Total Leads</span>
          <span className={s.kpiVal}>{totalLeads}</span>
          <span className={s.kpiSub}>Active pipeline</span>
        </div>
        <div className={s.kpiTile}>
          <span className={s.kpiLabel}>Needs Action</span>
          <span className={s.kpiVal} style={{ color: "#ff4f54" }}>{needsActionCount}</span>
          <span className={s.kpiSub}>New or flagged leads</span>
        </div>
        <div className={s.kpiTile}>
          <span className={s.kpiLabel}>Conversion Rate</span>
          <span className={s.kpiVal} style={{ color: "#25d366" }}>{conversionRate}%</span>
          <span className={s.kpiSub}>{wonCount} converted to clients</span>
        </div>
        <div className={s.kpiTile}>
          <span className={s.kpiLabel}>New Leads</span>
          <span className={s.kpiVal} style={{ color: "#3b82f6" }}>{newCount}</span>
          <span className={s.kpiSub}>Awaiting first contact</span>
        </div>
      </div>

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
                className={`${s.stripBtn} ${active ? s.stripBtnActive : ""}`}
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

        {/* Right Tools (Search, Add Lead) */}
        <div className={s.rightTools}>
          <div className={s.search}>
            <span className={s.searchIcon}><Search size={14} /></span>
            <input
              className={s.searchInput}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search leads, phone, goal…"
            />
          </div>

          <button className={s.addBtn} onClick={onAdd} type="button">+ Add lead</button>
        </div>
      </div>

      {/* ── Table View ── */}
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
            <span className={s.colLabel}>Category</span>
            <span className={`${s.colLabel} ${s.actionLabel}`}>Action</span>
            <span />
          </div>

          {/* empty */}
          {rows.length === 0 && (
            <div className={s.empty}>
              <Search size={30} />
              <h2>No leads found</h2>
              <p>Change the search query or stage filter, or add a new lead.</p>
            </div>
          )}

          {/* rows */}
          {rows.map((lead) => {
            const stageColor = STAGE_COLOR[lead.stage];
            const showLostReason = lead.stage === "Lost" && Boolean(lead.lostReason?.trim());
            const action = ACTIONS[lead.stage];
            const waNum = cleanPhone(lead.phone);

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
                    style={{ background: "linear-gradient(135deg, #e62429, #ff4f54)" }}
                  >

                    {lead.initials}
                  </span>
                  <div className={s.minCol}>
                    <div className={s.name}>{lead.name}</div>
                    {showLostReason ? (
                      <div className={`${s.note} ${s.lostReason}`}>Lost · {lead.lostReason}</div>
                    ) : (
                      <>
                        {lead.note && lead.note !== "No message submitted." && (
                          <div className={s.note} title={lead.note}>{lead.note}</div>
                        )}
                        {lead.preferredAvailability && (
                          <div className={s.prefDays} title={`Preferred availability: ${lead.preferredAvailability}`}>
                            📅 {lead.preferredAvailability}
                          </div>
                        )}
                        {!lead.preferredAvailability && (!lead.note || lead.note === "No message submitted.") && (
                          <div className={s.note}>—</div>
                        )}
                      </>
                    )}
                  </div>

                  {lead.injury && (
                    <span className={s.injuryPill} title={lead.injury}>
                      <TriangleAlert size={12} aria-hidden="true" />
                      <span>{lead.injury}</span>
                    </span>
                  )}
                </div>

                {/* source */}
                <div className={s.pad}>
                  <span className={s.sourcePill} data-source={lead.source}>{lead.source}</span>
                </div>

                {/* phone */}
                <div className={`${s.pad} ${s.phoneCell}`}>
                  <span className={s.phone}>
                    <span className={s.phoneIcon}><Phone size={12} aria-hidden="true" /></span>
                    {formatPhoneNumber(lead.phone)}
                  </span>
                  {waNum && (
                    <a
                      href={`https://wa.me/${waNum}`}
                      target="_blank"
                      rel="noreferrer"
                      className={s.waBtn}
                      title="Send WhatsApp message"
                    >
                      <MessageCircle size={13} aria-hidden="true" />
                    </a>
                  )}
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

                {/* category */}
                <div className={`${s.pad} ${s.categoryCell}`}>
                  <span className={s.categoryTag}>{lead.wants}</span>
                </div>


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
                      className={s.lostBtn}
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
