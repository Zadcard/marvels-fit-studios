"use client";
import { useOps } from "@/lib/ops/store";
import u from "../ui.module.css";

export default function PlanEditor() {
  const v = useOps();
  if (!v.planEditOpen) return null;
  return (
    <div className={u.overlay} onClick={v.closePlanEdit}>
      <div className={u.modal} style={{ maxWidth: 440 }} onClick={v.stopModal}>
        <div className={u.modalHead}>
          <div>
            <div className={u.modalKicker}>Plans &amp; pricing</div>
            <h2 className={u.modalTitle}>{v.planEditTitle}</h2>
          </div>
          <button className={u.modalClose} onClick={v.closePlanEdit}>✕</button>
        </div>
        <div className={u.modalBody}>
          <div>
            <label className={u.fieldLabel}>Plan name</label>
            <input className={u.input} value={v.peName} onChange={v.setPeName} placeholder="e.g. Group Monthly" />
          </div>
          <div>
            <label className={u.fieldLabel}>What&apos;s included</label>
            <input className={u.input} value={v.peDetail} onChange={v.setPeDetail} placeholder="e.g. Unlimited group classes · 30 days" />
          </div>
          <div>
            <label className={u.fieldLabel}>Price (EGP)</label>
            <input className={`${u.input} ${u.inputMono}`} value={v.pePrice} onChange={v.setPePrice} placeholder="0" />
          </div>
        </div>
        <div className={u.modalFoot}>
          <button className={u.cancelBtn} onClick={v.closePlanEdit}>Cancel</button>
          <button className={u.saveBtn} onClick={v.savePlan}>{v.planEditCta}</button>
        </div>
      </div>
    </div>
  );
}
