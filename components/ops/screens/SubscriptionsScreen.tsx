"use client";
import { useOps } from "@/lib/ops/store";
import { css } from "@/lib/ops/css";
import s from "./SubscriptionsScreen.module.css";

export default function SubscriptionsScreen() {
  const v = useOps();
  return (
    <div className={s.wrap}>
      <div className={s.tiles}>
        {v.subTiles.map((t: any, i: number) => (
          <div key={i} className={s.tile}>
            <div className={s.tileLabel}>{t.label}</div>
            <div className={s.tileVal} style={{ color: t.color }}>{t.value}</div>
            <div className={s.tileSub}>{t.sub}</div>
          </div>
        ))}
      </div>

      <section className={s.section}>
        <div className={s.sectionHead}>
          <h2 className={s.h2}>Members &amp; renewals</h2>
          <span className={s.expTag}>Expiring first</span>
        </div>
        <div className={s.colHead}>
          <span>Member</span><span>Plan</span><span>Sessions left</span><span>Method</span><span>Renews</span><span className={s.right}>Action</span>
        </div>
        {v.subs.map((sub: any, i: number) => (
          <div key={i} className={s.row}>
            <div className={s.member}>
              <span className={s.avatar} style={{ background: sub.grad }}>{sub.initials}</span>
              <div className={s.min}>
                <div className={s.name}>{sub.name}</div>
                <span className={s.statusPill} style={css(sub.statusStyle)}>{sub.status}</span>
              </div>
            </div>
            <div className={s.min}>{sub.plan}<div className={s.amount}>{sub.amount}</div></div>
            <div className={s.min}>
              <div className={s.remRow}><span className={s.remNum} style={{ color: sub.remColor }}>{sub.remaining}</span><span className={s.remOf}>of {sub.bundle}</span></div>
              <div className={s.remBar}><i className={s.remFill} style={{ width: sub.remPct, background: sub.remColor }} /></div>
            </div>
            <div className={s.min}><span className={s.methodBadge} style={css(sub.methodStyle)}>{sub.method}</span></div>
            <div className={s.due} style={{ color: sub.dueColor }}>{sub.due}<div className={s.expiry}>{sub.expiry}</div></div>
            <div className={s.actions}>
              <button className={s.cta} onClick={sub.ctaAct}>{sub.cta}</button>
              <button className={s.iconBtn} title="Change plan" onClick={sub.edit}>✎</button>
              <button className={`${s.iconBtn} ${s.iconDanger}`} title="Delete subscription" onClick={sub.del}>✕</button>
            </div>
          </div>
        ))}
      </section>

      <div className={s.trio}>
        <section className={s.pad}>
          <h2 className={s.h2}>Cash flow · February</h2>
          <div className={s.cashGrid}>
            <div className={s.cashCard}><div className={s.cashLabel}>Cash in</div><div className={s.cashIn}>{v.cashInMonth}</div></div>
            <div className={s.cashCard}><div className={s.cashLabel}>Cash out</div><div className={s.cashOut}>{v.cashOutMonth}</div></div>
          </div>
          <div className={s.netCard}><div className={s.cashLabel}>Net this month</div><div className={s.net}>{v.cashNetMonth}</div></div>
          <div className={s.byMethod}>By method</div>
          <div className={s.methods}>
            {v.methodSplit.map((m: any, i: number) => (
              <div key={i}>
                <div className={s.methodRow}><span>{m.label}</span><span className={s.methodVal}>{m.value}</span></div>
                <div className={s.mbar}><i className={s.mfill} style={{ width: m.pct, background: m.color }} /></div>
              </div>
            ))}
          </div>
        </section>

        <section className={s.section}>
          <div className={s.miniHead}>
            <h2 className={s.h2sm}>Cash out</h2>
            <button className={s.recordBtn} onClick={v.openCashOut}>+ Record</button>
          </div>
          {v.recentOut.map((o: any, i: number) => (
            <div key={i} className={s.txRow}>
              <span className={s.outIcon}>↑</span>
              <div className={s.min}><div className={s.txLabel}>{o.label}</div><div className={s.txMeta}>{o.cat} · {o.date}</div></div>
              <span className={s.outAmt}>−{o.amount}</span>
            </div>
          ))}
        </section>

        <section className={s.section}>
          <div className={s.miniHead}><h2 className={s.h2sm}>Recent income</h2></div>
          {v.cashLedger.map((tx: any, i: number) => (
            <div key={i} className={s.txRow}>
              <span className={s.inIcon} style={css(tx.iconStyle)}>{tx.icon}</span>
              <div className={s.min}><div className={s.txLabel}>{tx.label}</div><div className={s.txMeta}>{tx.time} · {tx.method}</div></div>
              <span className={s.inAmt} style={{ color: tx.amountColor }}>{tx.amount}</span>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
