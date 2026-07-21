"use client";
import { useOps } from "@/lib/ops/store";
import u from "../ui.module.css";
import s from "./ConfirmDialog.module.css";

export default function ConfirmDialog() {
  const v = useOps();
  if (!v.confirmOpen) return null;
  return (
    <div className={u.overlay} style={{ zIndex: 110 }} onClick={v.closeConfirm}>
      <div className={u.modal} style={{ maxWidth: 400 }} onClick={v.stopModal}>
        <div className={s.head}>
          <div className={s.warnIcon}>⚠</div>
          <h2 className={s.title}>{v.confirmTitle}</h2>
          <p className={s.body}>{v.confirmBody}</p>
        </div>
        <div className={s.foot}>
          <button className={u.cancelBtn} onClick={v.closeConfirm}>Cancel</button>
          <button className={s.deleteBtn} onClick={v.doConfirm}>Delete</button>
        </div>
      </div>
    </div>
  );
}
