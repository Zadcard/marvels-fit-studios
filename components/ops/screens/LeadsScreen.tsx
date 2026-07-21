"use client";
import { useOps } from "@/lib/ops/store";
import { css } from "@/lib/ops/css";
import { formatPhoneNumber } from "@/lib/phone-format";
import u from "../ui.module.css";
import s from "./LeadsScreen.module.css";

export default function LeadsScreen() {
  const v = useOps();
  return (
    <div className={s.wrap}>
      <div className={s.topRow}>
        <div className={s.strip}>
          {v.leadStrip.map((st: any) => (
            <button key={st.stage} className={s.stripBtn} style={{ background: st.bg }} onClick={st.toggle}>
              <span className={s.stripLabel}>
                <span className={s.stripDot} style={{ background: st.color }} />
                <span className={s.stripName} style={{ color: st.labelColor }}>{st.stage}</span>
              </span>
              <span className={s.stripCount} style={{ color: st.numColor }}>{st.count}</span>
            </button>
          ))}
        </div>
        <div className={s.search}>
          <span className={u.searchIcon}>⌕</span>
          <input className={u.searchInput} value={v.leadSearch} onChange={v.setLeadSearch} placeholder="Search leads…" />
        </div>
        <button className={u.primaryBtn} onClick={v.openIntakeLead}>+ Add lead</button>
      </div>

      <div className={`mv-scroll ${s.tableScroll}`}>
        <div className={s.table}>
          <div className={s.head}>
            <span />
            <button className={s.sortBtn} onClick={v.sortName}>Lead{v.arrName}</button>
            <button className={s.sortBtn} onClick={v.sortSource}>Source{v.arrSource}</button>
            <button className={s.sortBtn} onClick={v.sortWants}>Wants{v.arrWants}</button>
            <span className={s.colLabel}>Phone</span>
            <button className={s.sortBtn} onClick={v.sortStage}>Stage{v.arrStage}</button>
            <span className={s.colLabel}>Next step</span>
            <span /><span />
          </div>

          {v.leadsListEmpty && <div className={s.empty}>No leads match</div>}

          {v.leadRows.map((l: any, i: number) => (
            <div key={i} className={s.row} style={css(l.rowStyle)}>
              <span className={s.accent} style={{ background: l.stageColor }} />
              <div className={s.leadCell}>
                <span className={s.avatar} style={{ background: l.grad }}>{l.initials}</span>
                <div className={s.min}>
                  <div className={s.name}>{l.name}</div>
                  <div className={s.note}>{l.note}</div>
                </div>
                {l.hasInjury && <span className={s.warn} title={l.injury}>⚠</span>}
              </div>
              <div className={s.pad}><span className={s.sourcePill} style={css(l.sourceStyle)}>{l.source}</span></div>
              <div className={`${s.pad} ${s.wants}`}><span className={s.catDot} style={css(l.catDot)} /><span className={s.wantsText}>{l.wants}</span></div>
              <div className={s.pad}><span className={s.phone}><span className={s.phoneIcon}>✆</span>{formatPhoneNumber(l.phone)}</span></div>
              <div className={s.pad}><span className={s.stagePill} style={css(l.stagePill)}>{l.stage}</span></div>
              <div className={`${s.pad} ${s.min}`}><span className={s.nextStep} style={{ color: l.nextColor }}>{l.nextStep}</span></div>
              <div className={s.actionPad}>
                {l.hasAction && <button className={s.action} style={css(l.actionStyle)} onClick={l.act}>{l.action}</button>}
              </div>
              <div className={s.actionPad}><button className={s.del} title="Delete lead" onClick={l.del}>✕</button></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
