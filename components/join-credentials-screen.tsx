import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type JoinCredentialsScreenProps = {
  clientId: string;
  password: string;
  /** Heading content — differs between the full page and the landing modal. */
  header: ReactNode;
  className?: string;
};

/**
 * Shared success screen for the lead/join flow. Rendered by both the /join
 * page and the landing join modal so the credential cards and the
 * temporary-password guidance stay in exactly one place.
 */
export function JoinCredentialsScreen({
  clientId,
  password,
  header,
  className,
}: JoinCredentialsScreenProps) {
  return (
    <div className={cn("join-credentials-screen", className)} role="alert">
      <div className="join-credentials-screen__header">{header}</div>

      <div className="join-credentials-screen__stack">
        <div className="join-credentials-screen__card">
          <span>Client ID</span>
          <strong>{clientId}</strong>
        </div>
        <div className="join-credentials-screen__card">
          <span>Password</span>
          <strong>{password}</strong>
        </div>
      </div>

      <p className="join-credentials-screen__note">
        Someone from the studio team will accept your request.
      </p>
      <p className="join-credentials-screen__note">
        *Note: when you first log in, you must change this temporary password to
        a strong one.
      </p>
    </div>
  );
}
