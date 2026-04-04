"use client";

import { useState } from "react";
import { LoaderCircle, LogOut, ShieldCheck } from "lucide-react";
import { signOut, useSession } from "next-auth/react";

type DashboardSessionToolbarProps = {
  roleLabel: string;
};

export function DashboardSessionToolbar({
  roleLabel,
}: DashboardSessionToolbarProps) {
  const { data: session, status } = useSession();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");

  const displayName =
    session?.user?.name?.trim() ||
    session?.user?.email?.trim() ||
    `${roleLabel} member`;

  const supportLine =
    session?.user?.email?.trim() ||
    `Signed in to the ${roleLabel.toLowerCase()} workspace`;

  async function handleSignOut() {
    setLogoutError("");
    setIsSigningOut(true);

    try {
      await signOut({ redirectTo: "/login" });
    } catch {
      setLogoutError("Sign out did not complete. Please try again.");
      setIsSigningOut(false);
    }
  }

  return (
    <section className="dashboard-session-toolbar" aria-label={`${roleLabel} session controls`}>
      <div className="dashboard-session-toolbar__copy">
        <span className="dashboard-session-toolbar__status">
          <ShieldCheck size={16} />
          {status === "loading" ? "Refreshing session..." : "Protected session"}
        </span>
        <div>
          <strong>{displayName}</strong>
          <p>{supportLine}</p>
        </div>
      </div>

      <div className="dashboard-session-toolbar__actions">
        <button
          type="button"
          className="mv-btn mv-btn-outline"
          onClick={handleSignOut}
          disabled={isSigningOut}
        >
          {isSigningOut ? (
            <LoaderCircle size={16} className="animate-spin-slow" />
          ) : (
            <LogOut size={16} />
          )}
          {isSigningOut ? "Signing out..." : "Log out"}
        </button>

        {logoutError ? (
          <p className="dashboard-session-toolbar__error" role="alert">
            {logoutError}
          </p>
        ) : null}
      </div>
    </section>
  );
}
