import type { Metadata } from "next";
import Link from "next/link";

import { BrandLockup } from "@/components/ui/brand-lockup";

export const metadata: Metadata = {
  title: "Page not found",
};

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-6 py-16 text-center">
      <BrandLockup eyebrow="Marvel's Fit Studios" contextLabel="404" priority />

      <div className="grid max-w-md gap-3">
        <p className="mv-eyebrow justify-center">Page not found</p>
        <h1 className="font-[var(--font-display)] text-3xl font-bold tracking-tight text-white sm:text-4xl">
          This page doesn&apos;t exist.
        </h1>
        <p className="text-[color:var(--mv-muted)]">
          The link may be broken or the page may have moved. Let&apos;s get you
          back on track.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link href="/" className="mv-btn mv-btn-primary">
          Back to home
        </Link>
        <Link href="/login" className="mv-btn mv-btn-outline">
          Member sign in
        </Link>
      </div>
    </main>
  );
}
