"use client";
import { useOps } from "@/lib/ops/store";
import { css } from "@/lib/ops/css";
import u from "../ui.module.css";
import s from "./NotificationsScreen.module.css";

export default function NotificationsScreen() {
  const v = useOps();
  return (
    <div className={s.wrap}>
      <div className={s.filters}>
        {v.notifFilters.map((f: any) => (
          <button key={f.label} className={u.segChip} style={css(f.style)} onClick={f.pick}>
            {f.label}<span className={s.count}>{f.count}</span>
          </button>
        ))}
        <button className={s.markAll} onClick={v.markAllRead}>Mark all read</button>
      </div>

      {v.notifEmpty && (
        <div className={u.empty}>
          <div className={u.emptyGlyph}>◈</div>
          <div className={u.emptyTitle}>You&apos;re all caught up</div>
          <div className={u.emptySub}>Nothing under this filter right now.</div>
        </div>
      )}

      {v.notifGroups.map((grp: any) => (
        <section key={grp.label} className={s.section}>
          <div className={s.groupLabel}>{grp.label}</div>
          {grp.items.map((n: any, i: number) => (
            <div key={i} className={s.row} style={css(n.rowStyle)}>
              <span className={s.icon} style={css(n.iconStyle)}>{n.icon}</span>
              <div className={s.min}>
                <div className={s.title}>{n.title}</div>
                <div className={s.detail}>{n.detail}</div>
              </div>
              {n.hasAction && <button className={s.action} onClick={n.run}>{n.action}</button>}
              <span className={s.time}>{n.time}</span>
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}
