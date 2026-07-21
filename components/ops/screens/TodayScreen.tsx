"use client";
import { useOps } from "@/lib/ops/store";
import { css } from "@/lib/ops/css";
import s from "./TodayScreen.module.css";

export default function TodayScreen() {
  const v = useOps();
  return (
    <div className={s.wrap}>
      <div className={s.tiles}>
        <div className={s.tile}>
          <div className={s.tileLabel}>Live now</div>
          <div className={s.tileVal}>{v.liveCount}<span className={s.liveTag}> live</span></div>
          <div className={s.tileGood}>{v.liveNames}</div>
        </div>
        <div className={s.tile}>
          <div className={s.tileLabel}>Coming today</div>
          <div className={s.tileVal}>{v.sessionsToday}</div>
          <div className={s.tileSub}>{v.clientsExpected} clients expected</div>
        </div>
        <div className={s.tile}>
          <div className={s.tileLabel}>Trials today</div>
          <div className={s.tileVal} style={{ color: "var(--red2)" }}>{v.trialCount}</div>
          <div className={s.tileSub}>Need an outcome</div>
        </div>
        <div className={s.tile}>
          <div className={s.tileLabel}>Renew this week</div>
          <div className={s.tileVal} style={{ color: "var(--warn)" }}>{v.expiringCount}</div>
          <div className={s.tileSub}>{v.expiringValue} at stake</div>
        </div>
        <div className={`${s.tile} ${s.tileLast}`}>
          <div className={s.tileLabel}>Cash today</div>
          <div className={s.tileVal} style={{ color: "var(--success)" }}>{v.cashTodayNet}</div>
          <div className={s.tileSub}>{v.cashTodayCount} payments in</div>
        </div>
      </div>

      <div className={s.cols}>
        {/* LEFT */}
        <div className={s.col}>
          <section className={s.section}>
            <div className={s.sectionHead}>
              <div>
                <h2 className={s.h2}>Today&apos;s studio</h2>
                <div className={s.dateLong}>{v.dateLong}</div>
              </div>
              <button className={s.ghost} onClick={v.goSchedule}>Full schedule →</button>
            </div>
            <div>
              {v.todaySessions.map((se: any, i: number) => (
                <div key={i} className={s.sessionRow} style={css(se.rowStyle)} onClick={se.open}>
                  <div className={s.time}><div className={s.timeVal}>{se.time}</div><div className={s.dur}>{se.dur}</div></div>
                  <div className={s.min}>
                    <div className={s.sessionTitle}>
                      <strong className={s.cat}>{se.category}</strong>
                      <span className={s.typeTag} style={css(se.typeStyle)}>{se.type}</span>
                      {se.isLive && <span className={s.liveBadge}>● Live</span>}
                    </div>
                    <div className={s.coachLine}>
                      <span className={s.coachAvatar} style={{ background: se.coachGrad }}>{se.coachInitials}</span>
                      {se.coach}
                    </div>
                  </div>
                  <div className={s.sessionRight}>
                    <div className={s.inCount}><span className={s.inNum}>{se.present}</span>/{se.total} in</div>
                    <div className={s.bar}><i className={s.barFill} style={{ width: se.pct }} /></div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className={s.section}>
            <div className={s.sectionHead}>
              <h2 className={s.h2}>Who&apos;s busy right now</h2>
              <button className={s.linkBtn} onClick={v.goCoaches}>Availability →</button>
            </div>
            <div className={s.padY}>
              {v.coachNow.map((c: any, i: number) => (
                <div key={i} className={s.busyRow}>
                  <span className={s.coachAvatar} style={{ background: c.grad }}>{c.initials}</span>
                  <div className={s.busyName}>
                    <div className={s.name}>{c.name}</div>
                    <div className={s.role}>{c.role}</div>
                  </div>
                  <div className={s.busyNow}>{c.now}</div>
                  <span className={s.statusPill} style={css(c.statusStyle)}>{c.status}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* RIGHT */}
        <div className={s.col}>
          <section className={s.trials}>
            <div className={s.sectionHead}>
              <h2 className={s.h2}>Trials today</h2>
              <span className={s.trialsTag}>Decide &amp; convert</span>
            </div>
            <div className={s.padY}>
              {v.trials.map((t: any, i: number) => (
                <div key={i} className={s.trialRow}>
                  <div className={s.trialTop}>
                    <span className={s.coachAvatar} style={{ background: t.grad }}>{t.initials}</span>
                    <div className={s.min}>
                      <div className={s.trialName}>{t.name}</div>
                      <div className={s.trialMeta}>{t.time} · {t.category} · {t.type}</div>
                    </div>
                    <span className={s.sourceTag} style={css(t.sourceStyle)}>{t.source}</span>
                  </div>
                  <div className={s.trialBtns}>
                    <button className={s.subBtn} onClick={t.subscribe}>Subscribed</button>
                    <button className={s.followBtn} onClick={t.followUp}>Follow up</button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className={s.section}>
            <div className={s.sectionHead}>
              <h2 className={s.h2}>Renew this week</h2>
              <button className={s.linkBtn} onClick={v.goSubs}>All →</button>
            </div>
            <div>
              {v.renewSoon.map((r: any, i: number) => (
                <div key={i} className={s.renewRow}>
                  <span className={s.coachAvatar} style={{ background: r.grad }}>{r.initials}</span>
                  <div className={s.min}>
                    <div className={s.name}>{r.name}</div>
                    <div className={s.renewPlan}>{r.plan} · {r.amount}</div>
                    <div className={s.renewMethod}>Paid by {r.method}</div>
                  </div>
                  <div className={s.renewRight}>
                    <div className={s.due} style={{ color: r.dueColor }}>{r.due}</div>
                    <button className={s.remind} onClick={r.remind}>Remind</button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className={s.section}>
            <div className={s.sectionHead}>
              <h2 className={s.h2}>Cash today</h2>
              <button className={s.linkBtn} onClick={v.goSubs}>Cash flow →</button>
            </div>
            <div className={s.cashBody}>
              <div className={s.cashGrid}>
                <div className={s.cashCard}><div className={s.cashLabel}>Cash in</div><div className={s.cashIn}>{v.cashIn}</div></div>
                <div className={s.cashCard}><div className={s.cashLabel}>Cash out</div><div className={s.cashOut}>{v.cashOut}</div></div>
              </div>
              <div className={s.methods}>
                {v.methodsToday.map((m: any, i: number) => (
                  <div key={i}>
                    <div className={s.methodRow}><span>{m.label}</span><span className={s.methodVal}>{m.value}</span></div>
                    <div className={s.bar}><i className={s.barFill} style={{ width: m.pct, background: m.color }} /></div>
                  </div>
                ))}
              </div>
              <button className={s.recordBtn} onClick={v.openCashOut}>+ Record cash out</button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
