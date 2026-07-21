"use client";
import { useOps } from "@/lib/ops/store";
import { css } from "@/lib/ops/css";
import u from "../ui.module.css";
import s from "./IntakeModal.module.css";

export default function IntakeModal() {
  const v = useOps();
  if (!v.intakeOpen) return null;
  return (
    <div className={u.overlay} style={{ zIndex: 65 }} onClick={v.closeIntake}>
      <div className={`mv-scroll ${u.modal} ${u.modalScroll}`} style={{ maxWidth: 540 }} onClick={v.stopIntake}>
        <div className={s.stickyHead}>
          <div>
            <div className={u.modalKicker} style={{ color: "var(--red)" }}>Intake</div>
            <h2 className={u.modalTitle}>{v.intakeTitle}</h2>
            <div className={s.sub}>{v.intakeSub}</div>
          </div>
          <button className={u.modalClose} onClick={v.closeIntake}>✕</button>
        </div>

        <div className={u.modalBody}>
          <div className={s.tabs}>
            {v.inKindTabs.map((k: any) => (
              <button key={k.k} className={s.tab} style={css(k.style)} onClick={k.pick}>{k.label}</button>
            ))}
          </div>

          <div className={u.grid2}>
            <div>
              <label className={u.fieldLabel}>Full name</label>
              <input className={u.input} value={v.inName} onChange={v.setInName} placeholder="e.g. Omar Tarek" />
            </div>
            <div>
              <label className={u.fieldLabel}>Phone number</label>
              <input className={`${u.input} ${u.inputMono}`} value={v.inPhone} onChange={v.setInPhone} placeholder="+20 1XX XXX XXXX" />
            </div>
          </div>

          <div>
            <label className={u.fieldLabel}>Preferred class / category</label>
            <div className={u.chipRow}>
              {v.inCats.map((c: any) => (
                <button key={c.label} className={u.chip} style={css(c.style)} onClick={c.pick}>{c.label}</button>
              ))}
            </div>
          </div>

          {v.inIsLead && (
            <div>
              <label className={u.fieldLabel}>Where did they come from?</label>
              <div className={u.chipRow}>
                {v.inSources.map((sc: any) => (
                  <button key={sc.label} className={u.chip} style={css(sc.style)} onClick={sc.pick}>{sc.label}</button>
                ))}
              </div>
            </div>
          )}

          <div className={s.injuryCard}>
            <button className={s.injuryToggle} onClick={v.toggleInjury}>
              <span className={s.injuryTrack} style={css(v.injuryTrackStyle)}><i className={s.injuryKnob} style={css(v.injuryKnobStyle)} /></span>
              <span className={s.injuryText}>
                <span className={s.injuryTitle}>Has an injury / condition</span>
                <span className={s.injurySub}>Shown to coaches, never buried in notes</span>
              </span>
            </button>
            {v.inHasInjury && (
              <div className={s.injuryBody}>
                <textarea className={s.injuryTextarea} rows={2} placeholder="e.g. Left knee — ACL recovery. Modify squats to box depth." />
              </div>
            )}
          </div>

          <div>
            <label className={u.fieldLabel}>Notes</label>
            <textarea className={u.textarea} rows={2} placeholder="Goals, availability, anything worth remembering…" />
          </div>
        </div>

        <div className={s.stickyFoot}>
          <button className={u.cancelBtn} onClick={v.closeIntake}>Cancel</button>
          <button className={u.saveBtn} onClick={v.submitIntake}>{v.intakeCta}</button>
        </div>
      </div>
    </div>
  );
}
