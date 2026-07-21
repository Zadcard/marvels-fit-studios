"use client";
import { useOps } from "@/lib/ops/store";
import { css } from "@/lib/ops/css";
import u from "../ui.module.css";

export default function ClientEditor() {
  const v = useOps();
  if (!v.clientEditOpen) return null;
  const chipGroup = (label: string, chips: any[]) => (
    <div>
      <label className={u.fieldLabel}>{label}</label>
      <div className={u.chipRow}>
        {chips.map((c: any) => (
          <button key={c.label} className={u.chip} style={css(c.style)} onClick={c.pick}>{c.label}</button>
        ))}
      </div>
    </div>
  );
  return (
    <div className={u.overlay} onClick={v.closeClientEdit}>
      <div className={`mv-scroll ${u.modal} ${u.modalScroll}`} style={{ maxWidth: 500 }} onClick={v.stopModal}>
        <div className={u.modalHead}>
          <div>
            <div className={u.modalKicker}>Client</div>
            <h2 className={u.modalTitle}>{v.clientEditName}</h2>
          </div>
          <button className={u.modalClose} onClick={v.closeClientEdit}>✕</button>
        </div>
        <div className={u.modalBody}>
          <div>
            <label className={u.fieldLabel}>Phone number</label>
            <input className={`${u.input} ${u.inputMono}`} value={v.clPhone} onChange={v.setClPhone} placeholder="+20 1XX XXX XXXX" />
          </div>
          {chipGroup("Category", v.clCatChips)}
          {chipGroup("Coach", v.clCoachChips)}
          {chipGroup("Status", v.clStatusChips)}
        </div>
        <div className={u.modalFoot}>
          <button className={u.cancelBtn} onClick={v.closeClientEdit}>Cancel</button>
          <button className={u.saveBtn} onClick={v.saveClientEdit}>Save changes</button>
        </div>
      </div>
    </div>
  );
}
