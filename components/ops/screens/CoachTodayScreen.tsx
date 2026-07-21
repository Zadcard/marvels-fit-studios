"use client";
import { useOps } from "@/lib/ops/store";
import { css } from "@/lib/ops/css";
import s from "./CoachTodayScreen.module.css";

export default function CoachTodayScreen() {
  const v = useOps();
  return (
    <div className={s.wrap}>
      <div className={s.hero}>
        <span className={s.heroAvatar} style={{ background: v.selfGrad }}>{v.selfInitials}</span>
        <div className={s.heroText}>
          <h2 className={s.heroTitle}>Morning, {v.selfName}</h2>
          <div className={s.heroSub}>{v.selfRole} · Thursday 16 July</div>
        </div>
        <div className={s.heroStat}>
          <div className={s.statNum}>{v.myClientCount}</div>
          <div className={s.statLabel}>My clients</div>
        </div>
      </div>

      <div className={s.cols}>
        <section className={s.section}>
          <div className={s.head}><h2 className={s.h2}>My sessions today</h2></div>
          {v.mySessions.map((se: any, i: number) => (
            <div key={i} className={s.sessionBlock}>
              <div className={s.sessionTop}>
                <div className={s.time}><div className={s.timeVal}>{se.time}</div><div className={s.dur}>{se.dur}</div></div>
                <div className={s.sessionTitle}>
                  <strong className={s.cat}>{se.category}</strong>
                  {se.isLive && <span className={s.live}>● Live</span>}
                </div>
                <button className={s.markBtn} onClick={se.open}>Mark attendance</button>
              </div>
              <div className={s.roster}>
                {se.roster.map((p: any, j: number) => (
                  <span key={j} className={s.chip} style={css(p.chipStyle)}>{p.name}{p.hasInjury && <span className={s.chipWarn}>⚠</span>}</span>
                ))}
              </div>
            </div>
          ))}
        </section>

        <div className={s.side}>
          <section className={s.injSection}>
            <div className={s.injHead}><span className={s.warn}>⚠</span><h2 className={s.h2sm}>Injuries to watch</h2></div>
            {v.myNotes.map((n: any, i: number) => (
              <div key={i} className={s.injRow}>
                <span className={s.injDot} />
                <div className={s.min}><div className={s.injName}>{n.name}</div><div className={s.injInjury}>{n.injury}</div></div>
                <span className={s.injCat}>{n.cat}</span>
              </div>
            ))}
          </section>

          <section className={s.section}>
            <div className={s.head}><h2 className={s.h2sm}>Schedule changes</h2></div>
            {v.myChanges.map((ch: any, i: number) => (
              <div key={i} className={s.chgRow}>
                <div className={s.chgTop}><span className={s.chgName}>{ch.name}</span><span className={s.chgKind}>{ch.kind}</span></div>
                <div className={s.chgDetail}>{ch.detail}</div>
              </div>
            ))}
          </section>
        </div>
      </div>
    </div>
  );
}
