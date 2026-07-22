"use client";
import { useOps } from "@/lib/ops/store";
import { css } from "@/lib/ops/css";
import { formatPhoneNumber } from "@/lib/phone-format";
import u from "../ui.module.css";
import s from "./ClientsScreen.module.css";

export default function ClientsScreen() {
  const v = useOps();
  return (
    <div className={s.wrap}>
      <div className={s.tiles}>
        {v.clientTiles.map((t: any, i: number) => (
          <div key={i} className={s.tile} style={css(t.border)}>
            <div className={s.tileLabel}>{t.label}</div>
            <div className={s.tileVal} style={css(t.color)}>{t.value}</div>
          </div>
        ))}
      </div>

      <section className={u.card}>
        <div className={s.toolbar}>
          <div className={s.segs}>
            {v.clientSegs.map((seg: any) => (
              <button key={seg.label} className={u.segChip} style={css(seg.style)} onClick={seg.pick}>
                {seg.label}<span className={s.segCount}>{seg.count}</span>
              </button>
            ))}
          </div>
          <div className={s.search}>
            <span className={u.searchIcon}>⌕</span>
            <input className={u.searchInput} value={v.clientSearch} onChange={v.setClientSearch} placeholder="Search name, coach, phone…" />
          </div>
          <button className={u.primaryBtn} style={{ minHeight: 38 }} onClick={v.openIntakeClient}>+ New client</button>
        </div>

        <div className={s.colHead}>
          <span>Client</span><span>Category</span><span>Type</span><span>Coach</span><span>Status</span><span>Phone</span><span />
        </div>

        {v.clientsEmpty && (
          <div className={s.emptyPad}>
            <div className={u.emptyGlyph}>◉</div>
            <div className={u.emptyTitle}>No clients here</div>
            <div className={u.emptySub}>No one matches this segment or search.</div>
          </div>
        )}

        {v.clientsFiltered.map((cl: any, i: number) => (
          <div key={i} className={s.row} onClick={cl.open}>
            <div className={s.cell}>
              <span className={s.avatar} style={{ background: cl.grad }}>{cl.initials}</span>
              <div className={s.min}>
                <div className={s.name}>{cl.name}</div>
                {cl.hasInjury && <div className={s.injury}>⚠ {cl.injury}</div>}
              </div>
            </div>
            <div className={s.min}><span className={s.category}>{cl.category}</span></div>
            <div>
              <span className={s.typePill}>{cl.type === "Private" ? "PRIVATE" : "GROUP"}</span>
            </div>
            <div className={s.cell}>
              <span className={s.coachAvatar} style={{ background: cl.coachGrad }}>{cl.coachInitials}</span>
              <span className={s.coachName}>{cl.coach}</span>
            </div>
            <div><span className={s.statusPill} style={css(cl.statusStyle)}>{cl.status}</span></div>
            <div className={s.phoneCell}>
              <span className={s.phone}>{formatPhoneNumber(cl.phone)}</span>
              {cl.phone && (
                <a
                  href={`https://wa.me/${(cl.phone || "").replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className={s.waBtn}
                  title="Send WhatsApp message"
                  onClick={(e) => e.stopPropagation()}
                >
                  💬
                </a>
              )}
            </div>

            <div className={s.rowTools}>
              <div className={u.iconBtn} title="Edit client" onClick={cl.edit}>✎</div>
              <div className={`${u.iconBtn} ${u.iconBtnDanger}`} title="Delete client" onClick={cl.del}>✕</div>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
