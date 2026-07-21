"use client";
import { useOps } from "@/lib/ops/store";
import s from "./Topbar.module.css";

export default function Topbar() {
  const v = useOps();
  return (
    <header className={s.bar}>
      <div className={s.titleWrap}>
        <div className={s.crumb}>{v.crumb}</div>
        <h1 className={s.title}>{v.pageTitle}</h1>
      </div>
      <div className={s.right}>
        <div className={s.search} onClick={v.openCmd}>
          <span className={s.searchIcon}>⌕</span>
          <span className={s.searchText}>Search clients, coaches, sessions…</span>
          <kbd className={s.kbd}>/</kbd>
        </div>
        <div className={s.clock}>
          <span className={s.pulse} />
          <span className={s.now}>{v.nowLabel}</span>
        </div>
      </div>
    </header>
  );
}
