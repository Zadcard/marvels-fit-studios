"use client";
import { useOps } from "@/lib/ops/store";
import s from "./CoachPhoneScreen.module.css";

export default function CoachPhoneScreen() {
  const v = useOps();
  return (
    <div className={s.wrap}>
      <div className={s.phoneCol}>
        <div className={s.phone}>
          <div className={s.notch} />
          <div className={`mv-scroll ${s.screen}`}>
            <div className={s.header}>
              <span className={s.avatar} style={{ background: v.selfGrad }}>{v.selfInitials}</span>
              <div className={s.headMeta}><div className={s.name}>{v.selfName}</div><div className={s.role}>{v.selfRole}</div></div>
            </div>

            <div className={s.kicker}>Up next · live now</div>
            {v.mySessions.map((se: any, i: number) => (
              <div key={i} className={s.card}>
                <div className={s.cardTop}>
                  <div><div className={s.cat}>{se.category}</div><div className={s.meta}>{se.type} · {se.location}</div></div>
                  <div className={s.timeR}><div className={s.time}>{se.time}</div><div className={s.dur}>{se.dur}</div></div>
                </div>
                <div className={s.progRow}>
                  <div className={s.bar}><i className={s.barFill} style={{ width: se.pct }} /></div>
                  <span className={s.count}>{se.present}/{se.total}</span>
                </div>
                <button className={s.markBtn} onClick={se.open}>✓ Mark attendance</button>
              </div>
            ))}

            <div className={s.kickerMuted}>Injuries to watch</div>
            <div className={s.injCard}>
              {v.myNotes.map((n: any, i: number) => (
                <div key={i} className={s.injRow}>
                  <span className={s.injDot} />
                  <div><div className={s.injName}>{n.name}</div><div className={s.injInjury}>{n.injury}</div></div>
                </div>
              ))}
            </div>
            <div className={s.spacer} />
          </div>

          <div className={s.tabbar}>
            <div className={`${s.tab} ${s.tabActive}`}><span className={s.tabIcon}>◎</span><span className={s.tabLabel}>TODAY</span></div>
            <div className={s.tab}><span className={s.tabIcon}>▤</span><span className={s.tabLabel}>WEEK</span></div>
            <div className={s.tab}><span className={s.tabIcon}>◉</span><span className={s.tabLabel}>CLIENTS</span></div>
          </div>
        </div>
      </div>

      <div className={s.copy}>
        <div className={s.copyKicker}>Coach on mobile</div>
        <h2 className={s.copyTitle}>Everything a coach needs — nothing they don&apos;t.</h2>
        <p className={s.copyLede}>
          Coaches open the app in the studio and see only their day: the next session, who&apos;s in, and any
          injury to work around. One tap opens the same fast attendance screen admins use.
        </p>
        <ul className={s.list}>
          <li><span className={s.dash}>—</span> Today &amp; this week&apos;s schedule</li>
          <li><span className={s.dash}>—</span> Groups &amp; private clients</li>
          <li><span className={s.dash}>—</span> Injuries surfaced, never buried in notes</li>
          <li><span className={s.dash}>—</span> One-tap attendance &amp; schedule changes</li>
        </ul>
      </div>
    </div>
  );
}
