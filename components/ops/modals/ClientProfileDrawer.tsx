"use client";
import { useOps } from "@/lib/ops/store";
import { css } from "@/lib/ops/css";
import s from "./ClientProfileDrawer.module.css";

export default function ClientProfileDrawer() {
  const v = useOps();
  if (!v.profileOpen) return null;
  const p = v.profile;
  return (
    <div className={s.overlay} onClick={v.closeProfile}>
      <div className={`mv-scroll ${s.drawer}`} onClick={v.stopProfile}>
        <div className={s.header}>
          <button className={s.close} onClick={v.closeProfile}>✕</button>
          <div className={s.idRow}>
            <span className={s.avatar} style={{ background: p.grad }}>{p.initials}</span>
            <div className={s.idMeta}>
              <h2 className={s.name}>{p.name}</h2>
              <div className={s.badges}>
                <span className={s.statusPill} style={css(p.statusStyle)}>{p.status}</span>
                <span className={s.catText}>{p.category} · {p.type}</span>
              </div>
            </div>
          </div>
          <div className={s.actions}>
            <button className={s.renew} onClick={p.renew}>Renew</button>
            <button className={s.whatsapp} onClick={p.whatsapp}>✆ WhatsApp</button>
            <button className={s.change} onClick={p.changeSchedule}>Change schedule</button>
          </div>
          <div className={s.actions2}>
            <button className={s.editBtn} onClick={p.editClient}>✎ Edit details</button>
            <button className={s.removeBtn} onClick={p.delClient}>✕ Remove</button>
          </div>
        </div>

        {p.hasInjury && (
          <div className={s.injuryBanner}>
            <div className={s.injuryHead}><span>⚠</span><span className={s.injuryKicker}>Injury — always visible to coach</span></div>
            <div className={s.injuryList}>
              {p.injuryHist.map((inj: string, i: number) => (
                <div key={i} className={s.injuryItem}><span className={s.injuryDash}>—</span>{inj}</div>
              ))}
            </div>
          </div>
        )}

        <div className={s.statsWrap}>
          <div className={s.stats}>
            <div className={s.statCard}>
              <div className={s.statLabel}>Sessions left</div>
              <div className={s.statVal}><span style={{ color: p.remColor }}>{p.remaining}</span><span className={s.statOf}>of {p.bundle}</span></div>
              <div className={s.bar}><i className={s.barFill} style={{ width: p.remPct, background: p.remColor }} /></div>
            </div>
            <div className={s.statCard}>
              <div className={s.statLabel}>Attendance</div>
              <div className={s.statVal}><span>{p.attRate}</span></div>
              <div className={s.streak}>🔥 {p.streak}-session streak</div>
            </div>
          </div>
        </div>

        <div className={s.detailsWrap}>
          <div className={s.details}>
            <div className={s.detailRow}><span className={s.detailKey}>Phone</span><span className={s.detailMono}>{p.phone}</span></div>
            <div className={s.detailRow}><span className={s.detailKey}>Coach</span><span className={s.coachAvatar} style={{ background: p.coachGrad }}>{p.coachInitials}</span><span className={s.detailVal}>{p.coach}</span></div>
            <div className={s.detailRow}><span className={s.detailKey}>Schedule</span><span className={s.detailMuted}>{p.days}</span></div>
            <div className={s.detailRow}><span className={s.detailKey}>Plan</span><span className={s.detailVal}>{p.plan}</span></div>
            <div className={s.detailRow}><span className={s.detailKey}>Member since</span><span className={s.detailMuted}>{p.joined}</span></div>
          </div>
        </div>

        <div className={s.historyWrap}>
          <div className={s.historyLabel}>Recent activity</div>
          <div className={s.timeline}>
            {p.history.map((h: any, i: number) => (
              <div key={i} className={s.histItem}>
                <div className={s.histRail}><span className={s.histDot} style={css(h.dotStyle)} /><span className={s.histLine} /></div>
                <div className={s.histText}>{h.text}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
