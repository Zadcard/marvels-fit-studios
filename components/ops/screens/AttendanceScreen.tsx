"use client";
import { useOps } from "@/lib/ops/store";
import { css } from "@/lib/ops/css";
import s from "./AttendanceScreen.module.css";

export default function AttendanceScreen() {
  const v = useOps();
  return (
    <div className={s.wrap}>
      <div className={s.chips}>
        {v.sessionChips.map((c: any, i: number) => (
          <button key={i} className={s.chip} style={css(c.chipStyle)} onClick={c.select}>
            <span className={s.chipTime}>{c.time}</span>
            <span className={s.chipDiv} />
            <span className={s.chipMeta}>
              <span className={s.chipCat}>{c.category}</span>
              <span className={s.chipCount}>{c.present}/{c.total} in</span>
            </span>
          </button>
        ))}
      </div>

      <section className={s.section}>
        <div className={s.head}>
          <div className={s.headL}>
            <div className={s.titleRow}>
              <h2 className={s.title}>{v.selCategory}</h2>
              <span className={s.typeTag}>{v.selType}</span>
            </div>
            <div className={s.coachLine}>
              <span className={s.coachAvatar} style={{ background: v.selCoachGrad }}>{v.selCoachInitials}</span>
              {v.selCoach} · {v.selTime}
            </div>
          </div>
          <div className={s.headR}>
            <div className={s.bigCount}><span className={s.present}>{v.selPresent}</span><span className={s.total}>/{v.selTotal}</span></div>
            <div className={s.checkedLabel}>Checked in</div>
          </div>
          <button className={s.markAll} onClick={v.markAll}>✓ Mark all in</button>
        </div>

        <div className={s.hint}>Tap a row to check in · use the flags for exceptions</div>

        <div>
          {v.selRoster.map((p: any, i: number) => (
            <div key={i} className={s.row} style={css(p.rowStyle)} onClick={p.tap}>
              <span className={s.check} style={css(p.checkStyle)}>{p.checkGlyph}</span>
              <div className={s.min}>
                <div className={s.nameRow}>
                  <span className={s.name}>{p.name}</span>
                  {p.hasInjury && <span className={s.injuryTag}>⚠ {p.injury}</span>}
                  {p.isTrial && <span className={s.trialTag}>Trial</span>}
                </div>
                <div className={s.meta}>{p.meta}</div>
              </div>
              <div className={s.rowBtns} onClick={p.stop}>
                <button className={s.absentBtn} style={css(p.absentStyle)} title="Absent" onClick={p.setAbsent}>✕</button>
                <button className={s.lateBtn} style={css(p.lateStyle)} title="Late" onClick={p.setLate}>L</button>
              </div>
            </div>
          ))}
        </div>

        <div className={s.foot}>
          <div className={s.footStats}>
            <span className={s.sPresent}>● {v.selPresent} in</span>
            <span className={s.sAbsent}>● {v.selAbsent} absent</span>
            <span className={s.sLate}>● {v.selLate} late</span>
            <span className={s.sPending}>● {v.selPending} pending</span>
          </div>
          <button className={s.summary} onClick={v.sendSummary}>Send summary to coach</button>
        </div>
      </section>
    </div>
  );
}
