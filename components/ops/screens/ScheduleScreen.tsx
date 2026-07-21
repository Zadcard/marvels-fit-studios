"use client";
import { useOps } from "@/lib/ops/store";
import { css } from "@/lib/ops/css";
import s from "./ScheduleScreen.module.css";

export default function ScheduleScreen() {
  const v = useOps();
  return (
    <div className={s.wrap}>
      <section className={s.section}>
        <div className={s.head}>
          <div>
            <h2 className={s.h2}>Recurring week</h2>
            <div className={s.sub}>Every week · permanent groups</div>
          </div>
          <div className={s.navBtns}>
            <button className={s.navBtn} onClick={v.schedPrev}>‹</button>
            <button className={s.navBtn} onClick={v.schedNext}>›</button>
          </div>
        </div>
        <div className={`mv-scroll ${s.gridScroll}`}>
          <div className={s.gridInner}>
            <div className={s.dayHead}>
              <div />
              {v.weekDays.map((d: string) => <div key={d} className={s.dayCell}>{d}</div>)}
            </div>
            {v.schedGrid.map((row: any, i: number) => (
              <div key={i} className={s.gridRow}>
                <div className={s.timeCol}>{row.time}</div>
                {row.cells.map((cell: any, j: number) => (
                  <div key={j} className={s.cell}>
                    {cell.notEmpty && (
                      <div className={s.block} style={css(cell.style)}>
                        <div className={s.blockTop}>
                          <span className={s.blockCat}>{cell.cat}</span>
                          {cell.isLive && <span className={s.liveDot} />}
                        </div>
                        <div className={s.blockCoach}>{cell.coach}</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={s.section}>
        <div className={s.reqHead}>
          <h2 className={s.h2sm}>Change requests</h2>
          <div className={s.reqSub}>3 waiting · one-off vs recurring</div>
        </div>
        <div>
          {v.scheduleChanges.map((ch: any, i: number) => (
            <div key={i} className={s.req}>
              <div className={s.reqTop}>
                <span className={s.reqAvatar} style={{ background: ch.grad }}>{ch.initials}</span>
                <div className={s.min}><div className={s.reqName}>{ch.name}</div><div className={s.reqReason}>{ch.reason}</div></div>
                <span className={s.kindTag} style={css(ch.kindStyle)}>{ch.kind}</span>
              </div>
              <div className={s.reqDetail}>{ch.detail}</div>
              <div className={s.reqBtns}>
                <button className={s.approve} onClick={ch.approve}>Approve</button>
                <button className={s.decline} onClick={ch.decline}>Decline</button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
