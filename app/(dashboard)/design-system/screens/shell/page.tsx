import type { Metadata } from "next";
import { CalendarDays, ClipboardList, Users } from "lucide-react";

import { DashboardRoleShell } from "@/components/dashboard/dashboard-role-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/ui/metric-card";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";

export const metadata: Metadata = {
  title: "Responsive Dashboard Shell Preview",
  robots: { index: false, follow: false },
};

export default function DashboardShellPreviewPage() {
  return (
    <DashboardRoleShell
      role="admin"
      account={{
        name: "Marvel Admin",
        subtitle: "Studio administration",
        initials: "MA",
      }}
    >
      <div className="dashboard-stack">
        <PageHeader
          eyebrow="Admin overview"
          title="Dashboard Summary"
          description="A route-safe preview of the shared responsive shell and warm operational surfaces."
          actions={
            <button type="button" className="mv-btn mv-btn-primary">
              Review requests
            </button>
          }
        />

        <section className="grid gap-[var(--mv-space-md)] md:grid-cols-3" aria-label="Key metrics">
          <MetricCard label="Active members" value="248" change="+12" detail="this month" icon={Users} tone="brand" />
          <MetricCard label="Sessions" value="34" change="On track" detail="this week" icon={CalendarDays} />
          <MetricCard label="Join requests" value="9" change="3 ready" detail="for review" icon={ClipboardList} tone="warning" />
        </section>

        <section className="grid gap-[var(--mv-space-md)] lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.6fr)]">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <CardTitle>Today&apos;s sessions</CardTitle>
                  <CardDescription>Real screens will receive these rows from their existing repositories.</CardDescription>
                </div>
                <StatusBadge tone="success">Live</StatusBadge>
              </div>
            </CardHeader>
            <CardContent className="grid gap-3">
              {["Strength Foundations", "Conditioning Lab", "Private Progress Check"].map((title, index) => (
                <article key={title} className="flex items-center justify-between gap-4 rounded-[15px] border border-[color:var(--mv-border)] p-4">
                  <div className="min-w-0">
                    <strong className="block truncate text-[color:var(--mv-ink)]">{title}</strong>
                    <p className="mt-1 text-sm">{index === 2 ? "Private" : "Group"} · Marvel&apos;s Fit Studios</p>
                  </div>
                  <span className="font-[var(--font-display)] font-bold tabular-nums text-[color:var(--mv-ink)]">
                    {index === 0 ? "6:30 PM" : index === 1 ? "7:00 PM" : "8:00 PM"}
                  </span>
                </article>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Responsive behavior</CardTitle>
              <CardDescription>The centered app shell becomes edge-to-edge on small screens.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="grid list-none gap-3 p-0 text-sm text-[color:var(--mv-body)]">
                <li>Desktop top navigation with an icon rail</li>
                <li>Accessible modal navigation drawer below 1100px</li>
                <li>44px controls and visible keyboard focus</li>
                <li>No scaled desktop canvas or horizontal page scroll</li>
              </ul>
            </CardContent>
          </Card>
        </section>
      </div>
    </DashboardRoleShell>
  );
}
