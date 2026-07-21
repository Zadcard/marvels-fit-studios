"use client";
import { useEffect, useMemo, useState } from "react";
import { useOps } from "@/lib/ops/store";
import { css } from "@/lib/ops/css";
import s from "./CommandPalette.module.css";

export default function CommandPalette() {
  const v = useOps();
  const [hi, setHi] = useState(0);
  const flat = useMemo(
    () => v.cmdGroups.flatMap((grp: any) => grp.items),
    [v.cmdGroups],
  );

  useEffect(() => {
    setHi(0);
  }, [v.cmdQuery, v.cmdOpen]);

  if (!v.cmdOpen) return null;

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHi((h) => (flat.length ? (h + 1) % flat.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHi((h) => (flat.length ? (h - 1 + flat.length) % flat.length : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      flat[hi]?.run();
    }
  };

  return (
    <div className={s.overlay} onClick={v.closeCmd}>
      <div className={s.modal} onClick={v.stopModal}>
        <div className={s.head}>
          <span className={s.icon}>⌕</span>
          <input
            className={s.input}
            autoFocus
            placeholder="Search or jump to…"
            value={v.cmdQuery}
            onChange={v.cmdType}
            onKeyDown={onKeyDown}
          />
          <kbd className={s.kbd}>ESC</kbd>
        </div>
        <div className={`mv-scroll ${s.body}`}>
          {v.cmdEmpty && (
            <div className={s.empty}>
              <div className={s.emptyGlyph}>⌕</div>
              <div className={s.emptyTitle}>No matches for “{v.cmdQuery}”</div>
              <div className={s.emptySub}>Try a client, coach, or page name.</div>
            </div>
          )}
          {v.cmdGroups.map((grp: any) => (
            <div key={grp.label}>
              <div className={s.groupLabel}>{grp.label}</div>
              {grp.items.map((it: any, i: number) => {
                const itemIdx = flat.indexOf(it);
                const selected = itemIdx === hi;
                return (
                  <button
                    key={i}
                    className={selected ? `${s.item} ${s.itemOn}` : s.item}
                    onMouseEnter={() => setHi(itemIdx)}
                    onClick={it.run}
                  >
                    <span className={s.itemIcon} style={css(it.iconStyle)}>{it.icon}</span>
                    <span className={s.itemText}>
                      <span className={s.itemTitle}>{it.title}</span>
                      {it.hasSub && <span className={s.itemSub}>{it.sub}</span>}
                    </span>
                    <span className={s.itemKind}>{it.kind}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
