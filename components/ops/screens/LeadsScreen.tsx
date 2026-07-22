"use client";
import { useOps } from "@/lib/ops/store";
import { css } from "@/lib/ops/css";
import { formatPhoneNumber } from "@/lib/phone-format";
import u from "../ui.module.css";
import s from "./LeadsScreen.module.css";

export default function LeadsScreen() {
  const v = useOps();

  // KPI metrics calculations
  const totalLeads = v.leadStrip.reduce((acc: number, st: any) => acc + st.count, 0);
  const wonCount = v.leadStrip.find((st: any) => st.stage === "Won")?.count || 0;
  const newCount = v.leadStrip.find((st: any) => st.stage === "New")?.count || 0;
  const needsActionCount = v.leadRows.filter((l: any) => l.stage === "New" || l.hasInjury || l.attention).length;
  const conversionRate = totalLeads > 0 ? Math.round((wonCount / totalLeads) * 100) : 0;

  const cleanPhone = (phone: string) => (phone || "").replace(/\D/g, "");

  return (
    <div className={s.wrap}>
      {/* KPI Overview Tiles */}
      <div className={s.kpiGrid}>
        <div className={s.kpiTile}>
          <span className={s.kpiLabel}>Total Leads</span>
          <span className={s.kpiVal}>{totalLeads}</span>
          <span className={s.kpiSub}>Active pipeline</span>
        </div>
        <div className={s.kpiTile}>
          <span className={s.kpiLabel}>Needs Action</span>
          <span className={s.kpiVal} style={{ color: "var(--red2)" }}>{needsActionCount}</span>
          <span className={s.kpiSub}>New or flagged leads</span>
        </div>
        <div className={s.kpiTile}>
          <span className={s.kpiLabel}>Conversion Rate</span>
          <span className={s.kpiVal} style={{ color: "var(--success)" }}>{conversionRate}%</span>
          <span className={s.kpiSub}>{wonCount} converted to clients</span>
        </div>
        <div className={s.kpiTile}>
          <span className={s.kpiLabel}>New Leads</span>
          <span className={s.kpiVal} style={{ color: "var(--blue)" }}>{newCount}</span>
          <span className={s.kpiSub}>Awaiting first contact</span>
        </div>
      </div>

      {/* Pipeline Strip & Search Bar */}
      <div className={s.topRow}>
        <div className={s.strip}>
          {v.leadStrip.map((st: any) => {
            const isSelected = st.labelColor === "#fff";
            return (
              <button
                key={st.stage}
                className={`${s.stripBtn} ${isSelected ? s.stripBtnActive : ""}`}
                style={{ background: st.bg }}
                onClick={st.toggle}
              >
                <span className={s.stripLabel}>
                  <span className={s.stripDot} style={{ background: st.color }} />
                  <span className={s.stripName} style={{ color: st.labelColor }}>{st.stage}</span>
                </span>
                <span className={s.stripCount} style={{ color: st.numColor }}>{st.count}</span>
              </button>
            );
          })}
        </div>

        <div className={s.rightTools}>
          <div className={s.search}>
            <span className={u.searchIcon}>⌕</span>
            <input
              className={u.searchInput}
              value={v.leadSearch}
              onChange={v.setLeadSearch}
              placeholder="Search leads, phone, goal…"
            />
          </div>

          <button className={u.primaryBtn} onClick={v.openIntakeLead}>+ Add lead</button>
        </div>
      </div>

      {/* Table Area */}
      <div className={`mv-scroll ${s.tableScroll}`}>
        <div className={s.table}>
          <div className={s.head}>
            <span />
            <button className={s.sortBtn} onClick={v.sortName}>Lead{v.arrName}</button>
            <button className={s.sortBtn} onClick={v.sortSource}>Source{v.arrSource}</button>
            <span className={s.colLabel}>Phone</span>
            <button className={s.sortBtn} onClick={v.sortStage}>Stage{v.arrStage}</button>
            <button className={s.sortBtn} onClick={v.sortWants}>Category{v.arrWants}</button>
            <span className={`${s.colLabel} ${s.actionLabel}`}>Action</span>
            <span />
          </div>

          {v.leadsListEmpty && <div className={s.empty}>No leads match search or stage filter</div>}

          {v.leadRows.map((l: any, i: number) => {
            const waNum = cleanPhone(l.phone);
            return (
              <div key={i} className={s.row} data-stage={l.stage} style={css(l.rowStyle)}>

                <span className={s.accent} style={{ background: l.stageColor }} />
                <div className={s.leadCell}>
                  <span className={s.avatar} style={{ background: "linear-gradient(135deg, #e62429, #ff4f54)" }}>{l.initials}</span>

                  <div className={s.min}>
                    <div className={s.name}>{l.name}</div>
                    {l.note && l.note !== "No message submitted." && <div className={s.note} title={l.note}>{l.note}</div>}
                    {(l.preferredAvailability || l.availability) && (
                      <div className={s.prefDays} title={`Preferred availability: ${l.preferredAvailability || l.availability}`}>
                        📅 {l.preferredAvailability || l.availability}
                      </div>
                    )}
                    {!l.preferredAvailability && !l.availability && (!l.note || l.note === "No message submitted.") && (
                      <div className={s.note}>—</div>
                    )}
                  </div>

                  {l.hasInjury && (
                    <span className={s.injuryPill} title={l.injury}>
                      ⚠ {l.injury || "Injury"}
                    </span>
                  )}
                </div>
                <div className={s.pad}>
                  <span className={s.sourcePill} style={css(l.sourceStyle)}>{l.source}</span>
                </div>
                <div className={`${s.pad} ${s.phoneCell}`}>
                  <span className={s.phone}>
                    <span className={s.phoneIcon}>✆</span>
                    {formatPhoneNumber(l.phone)}
                  </span>
                  {waNum && (
                    <a
                      href={`https://wa.me/${waNum}`}
                      target="_blank"
                      rel="noreferrer"
                      className={s.waBtn}
                      title="Send WhatsApp message"
                    >
                      💬
                    </a>
                  )}
                </div>
                <div className={s.pad}>
                  <span className={s.stagePill} style={css(l.stagePill)}>{l.stage}</span>
                </div>
                <div className={`${s.pad} ${s.wants}`}>
                  <span className={s.catDot} style={css(l.catDot)} />
                  <span className={s.wantsText}>{l.wants}</span>
                </div>

                <div className={s.actionPad}>
                  {l.hasAction && (
                    <button className={s.action} style={css(l.actionStyle)} onClick={l.act}>
                      {l.action}
                    </button>
                  )}
                </div>
                <div className={s.actionPad}>
                  <button className={s.del} title="Delete lead" onClick={l.del}>✕</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
