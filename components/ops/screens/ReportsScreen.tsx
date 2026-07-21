"use client";
import { useOps } from "@/lib/ops/store";
import { css } from "@/lib/ops/css";
import s from "./ReportsScreen.module.css";

export default function ReportsScreen() {
  const v = useOps();
  return (
    <div className={s.wrap}>
      <div className={s.rangeRow}>
        <div className={s.ranges}>
          {v.repRanges.map((r: any) => (
            <button key={r.label} className={s.rangeBtn} style={css(r.style)} onClick={r.pick}>{r.label}</button>
          ))}
        </div>
        <span className={s.period}>{v.repPeriodLabel}</span>
      </div>

      <div className={s.kpis}>
        {v.repKpis.map((k: any, i: number) => (
          <div key={i} className={s.kpi}>
            <div className={s.kpiLabel}>{k.label}</div>
            <div className={s.kpiVal}>{k.value}</div>
            <div className={s.kpiDelta} style={css(k.deltaStyle)}>{k.delta}</div>
          </div>
        ))}
      </div>

      <div className={s.row1}>
        <section className={s.panel}>
          <div className={s.panelHead}><h2 className={s.h2}>Revenue trend</h2><span className={s.hint}>EGP · net · 6 mo</span></div>
          <div className={s.bars}>
            {v.repRevBars.map((b: any, i: number) => (
              <div key={i} className={s.barCol}>
                <span className={s.barVal}>{b.val}</span>
                <div className={s.bar} style={{ height: b.h, background: b.fill }} />
                <span className={s.barLabel}>{b.label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className={s.panel}>
          <div className={s.panelHead}><h2 className={s.h2}>Conversion funnel</h2></div>
          <div className={s.funnel}>
            {v.repFunnel.map((f: any, i: number) => (
              <div key={i}>
                <div className={s.funnelRow}><span>{f.label}</span><span className={s.funnelCount}>{f.count} · {f.pct}</span></div>
                <div className={s.hbar}><i className={s.hfill} style={{ width: f.pct, background: f.fill }} /></div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className={s.row2}>
        <section className={s.panel}>
          <div className={s.panelHead}><h2 className={s.h2}>Attendance by class</h2></div>
          <div className={s.funnel}>
            {v.repAttCats.map((c: any, i: number) => (
              <div key={i}>
                <div className={s.funnelRow}><span>{c.label}</span><span className={s.funnelCount}>{c.pct}</span></div>
                <div className={s.hbar}><i className={s.hfill} style={{ width: c.pct, background: c.fill }} /></div>
              </div>
            ))}
          </div>
        </section>

        <section className={s.panel}>
          <div className={s.panelHead}><h2 className={s.h2}>Coach utilization</h2></div>
          <div className={s.funnel}>
            {v.repCoachUtil.map((c: any, i: number) => (
              <div key={i} className={s.utilRow}>
                <span className={s.utilAvatar} style={{ background: c.grad }}>{c.initials}</span>
                <div className={s.utilBody}>
                  <div className={s.funnelRow}><span>{c.name}</span><span className={s.funnelCount}>{c.pct}</span></div>
                  <div className={s.hbar}><i className={s.hfill} style={{ width: c.pct, background: c.fill }} /></div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
