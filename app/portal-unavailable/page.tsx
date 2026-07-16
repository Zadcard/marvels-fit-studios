import type { Metadata } from "next";
import Link from "next/link";

import { BrandLockup } from "@/components/ui/brand-lockup";

export const metadata: Metadata = {
  title: "Client portal unavailable",
};

// Shown when a client account signs in while the client portal is parked for
// launch. The studio is admin- and coach-operated for the first release.
export default function PortalUnavailable() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-[color:var(--rl-canvas)] px-6 py-16 text-center">
      <BrandLockup eyebrow="Marvel's Fit Studios" contextLabel="Portal" priority />

      <div className="grid max-w-md gap-3">
        <p className="text-xs font-extrabold uppercase tracking-[.14em] text-[color:var(--rl-red)]">Client portal</p>
        <h1 className="font-[var(--font-display)] text-3xl font-bold tracking-tight text-[color:var(--rl-ink)] sm:text-4xl">
          The client portal isn&apos;t available yet.
        </h1>
        <p className="text-[color:var(--rl-muted)]">
          Marvel&apos;s Fit Studios is run by our admins and coaches for now. For
          schedules, subscriptions, or anything about your training, message the
          studio directly and the team will take care of it.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link href="/" className="mv-btn mv-btn-primary">
          Back to home
        </Link>
      </div>
    </main>
  );
}
