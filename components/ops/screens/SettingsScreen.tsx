"use client";
import { useOps } from "@/lib/ops/store";
import { css } from "@/lib/ops/css";
import u from "../ui.module.css";
import s from "./SettingsScreen.module.css";

export default function SettingsScreen() {
  const v = useOps();
  return (
    <div className={s.wrap}>
      <nav className={s.nav}>
        {v.setTabs.map((tb: any) => (
          <button key={tb.label} className={s.tab} style={css(tb.style)} onClick={tb.pick}>
            <span className={s.tabIcon}>{tb.icon}</span>{tb.label}
          </button>
        ))}
      </nav>

      <section className={s.panel}>
        <div className={s.panelHead}>
          <h2 className={s.h2}>{v.setPanelTitle}</h2>
          <p className={s.panelSub}>{v.setPanelSub}</p>
        </div>
        <div className={s.body}>
          {v.setShowFields && (
            <div className={s.fields}>
              {v.setFields.map((f: any, i: number) => (
                <div key={i} style={css(f.span)}>
                  <label className={u.fieldLabel}>{f.label}</label>
                  <input className={u.input} defaultValue={f.value} />
                </div>
              ))}
            </div>
          )}

          {v.setShowHours && (
            <div className={s.hours}>
              {v.setHours.map((h: any, i: number) => (
                <div key={i} className={s.hourRow}>
                  <span className={s.day}>{h.day}</span>
                  <span className={s.hourVal}>{h.hours}</span>
                  <span className={s.hourPill} style={css(h.pillStyle)}>{h.status}</span>
                </div>
              ))}
            </div>
          )}

          {v.setShowPlans && (
            <div className={s.plansWrap}>
              <div>
                <div className={s.subhead}>Class categories</div>
                <div className={s.catChips}>
                  {v.setCats.map((c: any) => (
                    <span key={c.label} className={s.catChip}><i className={s.catDot} style={{ background: c.color }} />{c.label}</span>
                  ))}
                </div>
              </div>
              <div>
                <div className={s.subheadRow}>
                  <div className={s.subhead}>Plans &amp; pricing</div>
                  <button className={s.addBtn} onClick={v.addPlan}>+ Add plan</button>
                </div>
                <div className={s.planList}>
                  {v.setPlans.map((p: any, i: number) => (
                    <div key={i} className={s.planRow}>
                      <div className={s.min}><div className={s.planName}>{p.name}</div><div className={s.planDetail}>{p.detail}</div></div>
                      <span className={s.planPrice}>{p.price}</span>
                      <button className={u.iconBtn} title="Edit plan" onClick={p.edit}>✎</button>
                      <button className={`${u.iconBtn} ${u.iconBtnDanger}`} title="Delete plan" onClick={p.del}>✕</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {v.setShowTeam && (
            <>
              <div className={s.subheadRow}>
                <div className={s.subhead}>Coaches &amp; access</div>
                <button className={s.addBtn} onClick={v.addCoach}>+ Add coach</button>
              </div>
              <div className={s.teamList}>
                {v.setTeam.map((t: any, i: number) => (
                  <div key={i} className={s.teamRow}>
                    <span className={s.teamAvatar} style={{ background: t.grad }}>{t.initials}</span>
                    <div className={s.min}><div className={s.teamName}>{t.name}</div><div className={s.teamCats}>{t.cats}</div></div>
                    <span className={s.rolePill} style={css(t.roleStyle)}>{t.role}</span>
                    <button className={u.iconBtn} title="Edit coach" onClick={t.edit}>✎</button>
                    <button className={`${u.iconBtn} ${u.iconBtnDanger}`} title="Remove coach" onClick={t.del}>✕</button>
                  </div>
                ))}
              </div>
            </>
          )}

          {v.setShowNotifPrefs && (
            <div className={s.prefs}>
              {v.setNotifPrefs.map((p: any, i: number) => (
                <div key={i} className={s.prefRow}>
                  <div className={s.min}><div className={s.prefLabel}>{p.label}</div><div className={s.prefDetail}>{p.detail}</div></div>
                  <span className={s.track} style={css(p.trackStyle)}><i className={s.knob} style={css(p.knobStyle)} /></span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className={s.foot}>
          <button className={s.discard} onClick={v.discardSettings}>Discard</button>
          <button className={s.save} onClick={v.saveSettings}>Save changes</button>
        </div>
      </section>
    </div>
  );
}
