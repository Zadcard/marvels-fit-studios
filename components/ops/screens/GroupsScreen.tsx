"use client";
import { useOps } from "@/lib/ops/store";
import { css } from "@/lib/ops/css";
import u from "../ui.module.css";
import s from "./GroupsScreen.module.css";

export default function GroupsScreen() {
  const v = useOps();
  return (
    <>
      <div className={u.pageHead}>
        <div>
          <h2 className={u.pageHeadTitle}>Recurring groups</h2>
          <p className={u.pageHeadSub}>Permanent weekly classes — coach and category at a glance.</p>
        </div>
        <div className={u.toolbar}>
          <div className={u.search}>
            <span className={u.searchIcon}>⌕</span>
            <input className={u.searchInput} value={v.groupSearch} onChange={v.setGroupSearch} placeholder="Search groups…" />
          </div>
          <button className={u.primaryBtn} style={{ minHeight: 38 }} onClick={v.addGroup}>+ New group</button>
        </div>
      </div>

      {v.groupsEmpty && (
        <div className={u.empty}>
          <div className={u.emptyGlyph}>⬡</div>
          <div className={u.emptyTitle}>No groups match</div>
          <div className={u.emptySub}>Try a different search or add a group.</div>
        </div>
      )}

      <div className={s.grid}>
        {v.groups.map((g: any) => (
          <section key={g.orig} className={s.card}>
            <div className={s.top}>
              <div className={s.titleWrap}>
                <h2 className={s.name}>{g.name}</h2>
                <div className={s.days}>{g.days}</div>
              </div>
              <div className={s.tools}>
                <button className={u.iconBtn} title="Edit group" onClick={g.edit}>✎</button>
                <button className={`${u.iconBtn} ${u.iconBtnDanger}`} title="Delete group" onClick={g.del}>✕</button>
              </div>
            </div>
            <div className={s.split}>
              <div className={s.splitL}><div className={s.metaKey}>Time</div><div className={s.metaVal}>{g.time}</div></div>
              <div className={s.splitR}><div className={s.metaKey}>Category</div><div className={s.metaVal}>{g.category}</div></div>
            </div>
            <div className={s.coachRow}>
              <span className={s.coachAvatar} style={{ background: g.coachGrad }}>{g.initials}</span>
              <div className={s.coachMeta}>
                <div className={s.coachName}>{g.coach}</div>
                <div className={s.members}>{g.members} members</div>
              </div>
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
