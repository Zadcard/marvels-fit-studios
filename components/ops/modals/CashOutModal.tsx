"use client";
import { useOps } from "@/lib/ops/store";
import { css } from "@/lib/ops/css";
import u from "../ui.module.css";

export default function CashOutModal() {
  const v = useOps();
  if (!v.cashOutOpen) return null;
  return (
    <div className={u.overlay} style={{ zIndex: 60 }} onClick={v.closeCashOut}>
      <div className={u.modal} style={{ maxWidth: 460 }} onClick={v.stopModal}>
        <div className={u.modalHead}>
          <div>
            <div className={u.modalKicker} style={{ color: "var(--danger)" }}>Money out</div>
            <h2 className={u.modalTitle}>Record cash out</h2>
          </div>
          <button className={u.modalClose} onClick={v.closeCashOut}>✕</button>
        </div>
        <div className={u.modalBody}>
          <div>
            <label className={u.fieldLabel}>Reason</label>
            <div className={u.chipRow}>
              {v.coCats.map((c: any) => (
                <button key={c.label} className={u.chip} style={css(c.style)} onClick={c.pick}>{c.label}</button>
              ))}
            </div>
          </div>
          <div>
            <label className={u.fieldLabel}>For whom / what</label>
            <input className={u.input} value={v.coWho} onChange={v.setCoWho} placeholder="e.g. Coach Ahmed Waheed — Feb salary" />
          </div>
          <div>
            <label className={u.fieldLabel}>Amount (EGP)</label>
            <input className={`${u.input} ${u.inputMono}`} value={v.coAmount} onChange={v.setCoAmount} placeholder="0" />
          </div>
        </div>
        <div className={u.modalFoot}>
          <button className={u.cancelBtn} onClick={v.closeCashOut}>Cancel</button>
          <button className={u.saveBtn} onClick={v.submitCashOut}>Record expense</button>
        </div>
      </div>
    </div>
  );
}
