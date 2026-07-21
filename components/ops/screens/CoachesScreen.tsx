"use client";
import { useOps } from "@/lib/ops/store";
import { css } from "@/lib/ops/css";
import u from "../ui.module.css";
import s from "./CoachesScreen.module.css";

export default function CoachesScreen() {
  const v = useOps();
  return (
    <>
      <div className={u.pageHead}>
        <div>
          <h2 className={u.pageHeadTitle}>Coaching team</h2>
          <p className={u.pageHeadSub}>Qualifications, assigned groups, and weekly sessions.</p>
        </div>
        <div className={u.toolbar}>
          <div className={u.search}>
            <span className={u.searchIcon}>⌕</span>
            <input className={u.searchInput} value={v.coachSearch} onChange={v.setCoachSearch} placeholder="Search coaches…" />
          </div>
          <button className={u.primaryBtn} style={{ minHeight: 38 }} onClick={v.addCoach}>+ Add coach</button>
        </div>
      </div>

      {v.coachesEmpty && (
        <div className={u.empty}>
          <div className={u.emptyGlyph}>◭</div>
          <div className={u.emptyTitle}>No coaches match</div>
          <div className={u.emptySub}>Try a different search.</div>
        </div>
      )}

      <div className={s.grid}>
        {v.coachCards.map((c: any, idx: number) => (
          <section key={idx} className={s.card}>
            <div className={s.head}>
              <span className={s.avatar} style={{ background: c.grad }}>{c.initials}</span>
              <div className={s.meta}>
                <div className={s.name}>{c.name}</div>
                <div className={s.role}>{c.role} · {c.cats}</div>
              </div>
              <button className={u.iconBtn} title="Edit coach" onClick={c.edit}>✎</button>
              <button className={`${u.iconBtn} ${u.iconBtnDanger}`} title="Delete coach" onClick={c.del}>✕</button>
            </div>
            <div className={s.timeline}>
              {c.timeline.map((b: any, i: number) => (
                <div key={i} className={s.slot}>
                  <div className={s.slotBar} style={css(b.style)} />
                  <span className={s.slotLabel}>{b.h}</span>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
