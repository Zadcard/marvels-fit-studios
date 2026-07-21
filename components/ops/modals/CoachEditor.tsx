"use client";
import { useOps } from "@/lib/ops/store";
import { css } from "@/lib/ops/css";
import u from "../ui.module.css";
import s from "./CoachEditor.module.css";

export default function CoachEditor() {
  const v = useOps();
  if (!v.coachEditOpen) return null;
  return (
    <div className={u.overlay} onClick={v.closeCoachEdit}>
      <div className={u.modal} style={{ maxWidth: 480 }} onClick={v.stopModal}>
        <div className={s.head}>
          <span className={s.avatar} style={{ background: v.ceGrad }}>{v.ceInitials}</span>
          <div className={s.headText}>
            <div className={u.modalKicker}>Coaches</div>
            <h2 className={u.modalTitle}>{v.coachEditTitle}</h2>
          </div>
          <button className={u.modalClose} onClick={v.closeCoachEdit}>✕</button>
        </div>
        <div className={u.modalBody}>
          <div className={u.grid2}>
            <div>
              <label className={u.fieldLabel}>Full name</label>
              <input className={u.input} value={v.ceName} onChange={v.setCeName} placeholder="e.g. Ahmed Waheed" />
            </div>
            <div>
              <label className={u.fieldLabel}>Role / title</label>
              <input className={u.input} value={v.ceRole} onChange={v.setCeRole} placeholder="e.g. Strength Coach" />
            </div>
          </div>
          <div>
            <label className={u.fieldLabel}>Categories</label>
            <div className={u.chipRow}>
              {v.ceCatChips.map((c: any) => (
                <button key={c.label} className={u.chip} style={css(c.style)} onClick={c.pick}>{c.label}</button>
              ))}
            </div>
          </div>
          <div className={s.toggleRow}>
            <div>
              <div className={s.toggleTitle}>Active coach</div>
              <div className={s.toggleSub}>Inactive coaches are hidden from scheduling</div>
            </div>
            <button className={s.track} style={css(v.ceActiveTrack)} onClick={v.toggleCeActive}>
              <i className={s.knob} style={css(v.ceActiveKnob)} />
            </button>
          </div>
        </div>
        <div className={u.modalFoot}>
          <button className={u.cancelBtn} onClick={v.closeCoachEdit}>Cancel</button>
          <button className={u.saveBtn} onClick={v.saveCoach}>{v.coachEditCta}</button>
        </div>
      </div>
    </div>
  );
}
