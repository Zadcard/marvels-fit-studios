"use client";
import { useOps } from "@/lib/ops/store";
import { css } from "@/lib/ops/css";
import u from "../ui.module.css";

export default function SubEditor() {
  const v = useOps();
  if (!v.subEditOpen) return null;
  return (
    <div className={u.overlay} onClick={v.closeSubEdit}>
      <div className={u.modal} style={{ maxWidth: 460 }} onClick={v.stopModal}>
        <div className={u.modalHead}>
          <div>
            <div className={u.modalKicker}>Subscription</div>
            <h2 className={u.modalTitle}>{v.subEditName}</h2>
          </div>
          <button className={u.modalClose} onClick={v.closeSubEdit}>✕</button>
        </div>
        <div className={u.modalBody}>
          <div>
            <label className={u.fieldLabel}>Plan</label>
            <div className={u.chipRow}>
              {v.sePlanChips.map((p: any) => (
                <button key={p.label} className={u.chip} style={css(p.style)} onClick={p.pick}>{p.label}</button>
              ))}
            </div>
          </div>
          <div>
            <label className={u.fieldLabel}>Amount (EGP)</label>
            <input className={`${u.input} ${u.inputMono}`} value={v.seAmount} onChange={v.setSeAmount} placeholder="0" />
          </div>
          <div>
            <label className={u.fieldLabel}>Payment method</label>
            <div className={u.chipRow}>
              {v.seMethodChips.map((m: any) => (
                <button key={m.label} className={u.chip} style={css(m.style)} onClick={m.pick}>{m.label}</button>
              ))}
            </div>
          </div>
        </div>
        <div className={u.modalFoot}>
          <button className={u.cancelBtn} onClick={v.closeSubEdit}>Cancel</button>
          <button className={u.saveBtn} onClick={v.saveSubEdit}>Save changes</button>
        </div>
      </div>
    </div>
  );
}
