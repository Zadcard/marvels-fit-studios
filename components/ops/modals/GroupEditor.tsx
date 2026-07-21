"use client";
import { useOps } from "@/lib/ops/store";
import { css } from "@/lib/ops/css";
import u from "../ui.module.css";

export default function GroupEditor() {
  const v = useOps();
  if (!v.groupEditOpen) return null;
  return (
    <div className={u.overlay} onClick={v.closeGroupEdit}>
      <div className={`mv-scroll ${u.modal} ${u.modalScroll}`} style={{ maxWidth: 500 }} onClick={v.stopModal}>
        <div className={u.modalHead}>
          <div>
            <div className={u.modalKicker}>Groups</div>
            <h2 className={u.modalTitle}>{v.groupEditTitle}</h2>
          </div>
          <button className={u.modalClose} onClick={v.closeGroupEdit}>✕</button>
        </div>
        <div className={u.modalBody}>
          <div>
            <label className={u.fieldLabel}>Group name</label>
            <input className={u.input} value={v.geName} onChange={v.setGeName} placeholder="e.g. Strength Class" />
          </div>
          <div>
            <label className={u.fieldLabel}>Category</label>
            <input className={u.input} value={v.geCat} onChange={v.setGeCat} placeholder="e.g. Strength" />
          </div>
          <div className={u.grid2} style={{ gridTemplateColumns: "1.4fr 1fr" }}>
            <div>
              <label className={u.fieldLabel}>Days</label>
              <input className={u.input} value={v.geDays} onChange={v.setGeDays} placeholder="Sat · Mon · Wed" />
            </div>
            <div>
              <label className={u.fieldLabel}>Time</label>
              <input className={u.input} value={v.geTime} onChange={v.setGeTime} placeholder="5:00 PM" />
            </div>
          </div>
          <div>
            <label className={u.fieldLabel}>Coach</label>
            <div className={u.chipRow}>
              {v.geCoachChips.map((c: any) => (
                <button key={c.label} className={u.chip} style={css(c.style)} onClick={c.pick}>{c.label}</button>
              ))}
            </div>
          </div>
        </div>
        <div className={u.modalFoot}>
          <button className={u.cancelBtn} onClick={v.closeGroupEdit}>Cancel</button>
          <button className={u.saveBtn} onClick={v.saveGroup}>{v.groupEditCta}</button>
        </div>
      </div>
    </div>
  );
}
