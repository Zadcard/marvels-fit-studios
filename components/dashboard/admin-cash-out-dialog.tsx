"use client";

import { useState } from "react";
import { Dialog } from "radix-ui";
import { BanknoteArrowDown, X } from "lucide-react";

import styles from "./admin-cash-out-dialog.module.css";

const categories = ["Supplies", "Maintenance", "Coach payment", "Other"];

export function AdminCashOutDialog() {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState(categories[0]);
  const [saved, setSaved] = useState(false);

  return <Dialog.Root open={open} onOpenChange={(next) => { setOpen(next); if (next) setSaved(false); }}>
    <Dialog.Trigger asChild><button className={styles.trigger} type="button">+ Record cash out</button></Dialog.Trigger>
    <Dialog.Portal>
      <Dialog.Overlay className={styles.overlay} />
      <Dialog.Content className={styles.content} aria-describedby={undefined}>
        <header><span><BanknoteArrowDown size={18} /><Dialog.Title>Record cash out</Dialog.Title></span><Dialog.Close asChild><button type="button" aria-label="Close cash out"><X size={18} /></button></Dialog.Close></header>
        {saved ? <div className={styles.confirmation}><strong>Cash out recorded</strong><p>This prototype keeps the entry in local UI state only.</p><Dialog.Close asChild><button type="button">Done</button></Dialog.Close></div> : <form onSubmit={(event) => { event.preventDefault(); setSaved(true); }}>
          <label>Amount <input name="amount" inputMode="decimal" placeholder="0.00" required /></label>
          <label>Category <span className={styles.chips}>{categories.map((item) => <button key={item} type="button" data-active={category === item || undefined} onClick={() => setCategory(item)}>{item}</button>)}</span></label>
          <label>Note <textarea name="note" placeholder="What was this payment for?" rows={3} /></label>
          <button className={styles.submit} type="submit">Record cash out</button>
        </form>}
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
