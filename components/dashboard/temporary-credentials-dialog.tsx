"use client";

import { useState } from "react";
import { Check, Copy, KeyRound, X } from "lucide-react";
import { Dialog } from "radix-ui";

import styles from "./temporary-credentials-dialog.module.css";

export type TemporaryCredentials = {
  accountType: "client" | "coach";
  signInId: string;
  temporaryPassword: string;
};

export function TemporaryCredentialsDialog({
  credentials,
  onClose,
}: {
  credentials: TemporaryCredentials | null;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);

  function close() {
    setCopied(false);
    setCopyFailed(false);
    onClose();
  }

  async function copyCredentials() {
    if (!credentials || !navigator.clipboard) {
      setCopyFailed(true);
      return;
    }

    try {
      await navigator.clipboard.writeText(
        `Sign-in: ${credentials.signInId}\nTemporary password: ${credentials.temporaryPassword}`,
      );
      setCopied(true);
      setCopyFailed(false);
    } catch {
      setCopied(false);
      setCopyFailed(true);
    }
  }

  return (
    <Dialog.Root
      open={credentials !== null}
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className={styles.overlay} />
        <Dialog.Content className={styles.dialog}>
          <Dialog.Title>
            <KeyRound size={21} /> {credentials?.accountType === "coach" ? "Coach" : "Client"} access created
          </Dialog.Title>
          <Dialog.Description>
            Copy these details now and share them securely. The password is shown only once and must be changed at first sign-in.
          </Dialog.Description>
          <Dialog.Close className={styles.close} aria-label="Close temporary credentials">
            <X size={18} />
          </Dialog.Close>

          <dl>
            <div>
              <dt>{credentials?.accountType === "coach" ? "Email" : "Client ID"}</dt>
              <dd>{credentials?.signInId}</dd>
            </div>
            <div>
              <dt>Temporary password</dt>
              <dd>{credentials?.temporaryPassword}</dd>
            </div>
          </dl>

          <p>
            The stored password is hashed. Closing this dialog removes the clear-text copy from the interface.
          </p>
          {copyFailed ? <p role="alert">Copy was blocked by the browser. Select the values above and copy them manually.</p> : null}
          <footer>
            <button type="button" className="mv-btn mv-btn-secondary" onClick={close}>
              Done
            </button>
            <button type="button" className="mv-btn mv-btn-primary" onClick={copyCredentials}>
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? "Copied" : "Copy credentials"}
            </button>
          </footer>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
