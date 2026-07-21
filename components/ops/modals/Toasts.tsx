"use client";
import { useOps } from "@/lib/ops/store";
import { css } from "@/lib/ops/css";
import s from "./Toasts.module.css";

export default function Toasts() {
  const v = useOps();
  return (
    <div className={s.wrap}>
      {v.toastList.map((t: any) => (
        <div key={t.key} className={s.toast} style={css(t.style)}>
          <span className={s.icon} style={{ color: t.iconColor }}>{t.icon}</span>
          <span className={s.msg}>{t.msg}</span>
        </div>
      ))}
    </div>
  );
}
