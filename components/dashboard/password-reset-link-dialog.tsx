"use client";

import { useState } from "react";
import { Check, Copy, KeyRound, X } from "lucide-react";
import { Dialog } from "radix-ui";

import styles from "./temporary-credentials-dialog.module.css";

export type PasswordResetLink = {
  accountName: string;
  accountType: "client" | "coach";
  expiresAt: string;
  url: string;
};

export function PasswordResetLinkDialog({
  resetLink,
  onClose,
}: {
  resetLink: PasswordResetLink | null;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);

  function close() {
    setCopied(false);
    setCopyFailed(false);
    onClose();
  }

  async function copyLink() {
    if (!resetLink || !navigator.clipboard) {
      setCopyFailed(true);
      return;
    }

    try {
      await navigator.clipboard.writeText(resetLink.url);
      setCopied(true);
      setCopyFailed(false);
    } catch {
      setCopied(false);
      setCopyFailed(true);
    }
  }

  const expiryLabel = resetLink
    ? new Intl.DateTimeFormat("en-EG", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Africa/Cairo",
      }).format(new Date(resetLink.expiresAt))
    : "";

  return (
    <Dialog.Root
      open={resetLink !== null}
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className={styles.overlay} />
        <Dialog.Content className={styles.dialog}>
          <Dialog.Title>
            <KeyRound size={21} /> One-time reset link
          </Dialog.Title>
          <Dialog.Description>
            Copy this link now and share it securely with {resetLink?.accountName}. Issuing another link revokes this one.
          </Dialog.Description>
          <Dialog.Close className={styles.close} aria-label="Close password reset link">
            <X size={18} />
          </Dialog.Close>

          <dl>
            <div>
              <dt>{resetLink?.accountType === "coach" ? "Coach" : "Client"}</dt>
              <dd>{resetLink?.accountName}</dd>
            </div>
            <div>
              <dt>Reset link</dt>
              <dd>{resetLink?.url}</dd>
            </div>
            <div>
              <dt>Expires</dt>
              <dd>{expiryLabel}</dd>
            </div>
          </dl>

          <p>The database stores only a hash of this link token. It expires after 30 minutes and works once.</p>
          {copyFailed ? <p role="alert">Copy was blocked by the browser. Select the link above and copy it manually.</p> : null}
          <footer>
            <button type="button" className="mv-btn mv-btn-secondary" onClick={close}>Done</button>
            <button type="button" className="mv-btn mv-btn-primary" onClick={copyLink}>
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? "Copied" : "Copy reset link"}
            </button>
          </footer>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
