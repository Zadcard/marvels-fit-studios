import type { Metadata } from "next";
import Image from "next/image";
import {
  Bell,
  CalendarDays,
  Dumbbell,
  Plus,
  TrendingUp,
  Users,
} from "lucide-react";

import brandMark from "@/Marvel frontend redesign-handoff/marvel-frontend-redesign/project/assets/ms-mark-red.png";

import { EmptyState } from "@/components/ui/empty-state";
import { IconChip } from "@/components/ui/icon-chip";
import { MetricCard } from "@/components/ui/metric-card";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";

import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Light Design System Preview",
  robots: { index: false, follow: false },
};

const swatches = [
  { name: "Primary", hex: "#e62429" },
  { name: "Primary deep", hex: "#c21c21" },
  { name: "Ink", hex: "#1c1916" },
  { name: "Body", hex: "#4a443d" },
  { name: "Muted", hex: "#8b857e" },
  { name: "Backdrop", hex: "#e3e0dd" },
  { name: "App background", hex: "#f1efec" },
  { name: "Card", hex: "#ffffff" },
  { name: "Success", hex: "#1f9d63" },
  { name: "Warning", hex: "#ef7c37" },
];

export default function LightDesignSystemPreviewPage() {
  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <div className={styles.masthead}>
          <Image
            src={brandMark}
            alt="Marvel's Fit Studios"
            width={56}
            height={56}
            className={styles.logo}
            priority
          />
          <div>
            <p className="mv-eyebrow">Marvel&apos;s Fit Studios</p>
            <h1 className={styles.pageTitle}>Light design system</h1>
          </div>
        </div>
        <p className={styles.intro}>
          The production foundation for the warm healthcare-inspired Marvel Fit
          experience across admin, coach, client, public, and authentication surfaces.
        </p>

        <div className={styles.stack}>
          <section className={styles.section} aria-labelledby="color-title">
            <header className={styles.sectionHeader}>
              <span className={styles.sectionNumber}>01</span>
              <h2 id="color-title">Color</h2>
            </header>
            <div className={styles.swatches}>
              {swatches.map((swatch) => (
                <article className={styles.swatch} key={swatch.hex}>
                  <div
                    className={styles.swatchColor}
                    style={{ backgroundColor: swatch.hex }}
                    aria-hidden="true"
                  />
                  <div className={styles.swatchCopy}>
                    <strong>{swatch.name}</strong>
                    <code>{swatch.hex}</code>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className={styles.section} aria-labelledby="type-title">
            <header className={styles.sectionHeader}>
              <span className={styles.sectionNumber}>02</span>
              <h2 id="type-title">Typography</h2>
            </header>
            <div className={styles.typeScale}>
              <div className={styles.typeRow}>
                <small>Space Grotesk 700 · page title</small>
                <span className={styles.pageTitle}>Dashboard Summary</span>
              </div>
              <div className={styles.typeRow}>
                <small>Space Grotesk 700 · metric</small>
                <span className={styles.metricValue}>248</span>
              </div>
              <div className={styles.typeRow}>
                <small>Manrope 600 · body</small>
                <span className={styles.bodySample}>
                  Live priorities and studio performance, connected to real data.
                </span>
              </div>
            </div>
          </section>

          <section className={styles.section} aria-labelledby="component-title">
            <header className={styles.sectionHeader}>
              <span className={styles.sectionNumber}>03</span>
              <h2 id="component-title">Core components</h2>
            </header>

            <div className={styles.componentGrid}>
              <article className={styles.componentCard}>
                <span className={styles.componentLabel}>Buttons</span>
                <div className={styles.buttonRow}>
                  <button type="button" className="mv-btn mv-btn-primary">
                    Add session <Plus size={15} />
                  </button>
                  <button type="button" className="mv-btn mv-btn-secondary">
                    View schedule
                  </button>
                  <button type="button" className="mv-icon-btn" aria-label="Notifications">
                    <Bell size={18} />
                  </button>
                </div>
              </article>

              <article className={styles.componentCard}>
                <span className={styles.componentLabel}>Status</span>
                <div className={styles.badgeRow}>
                  <StatusBadge tone="success">On track</StatusBadge>
                  <StatusBadge tone="warning">Waitlist</StatusBadge>
                  <StatusBadge tone="critical">Overdue</StatusBadge>
                  <StatusBadge>Pending</StatusBadge>
                </div>
                <div className={styles.chipRow}>
                  <IconChip icon={CalendarDays} />
                  <IconChip icon={Users} tone="brand" />
                  <IconChip icon={Dumbbell} tone="warning" />
                </div>
              </article>

              <article className={styles.componentCard}>
                <span className={styles.componentLabel}>Segmented control</span>
                <div className="mv-tab-track" role="tablist" aria-label="Plan status">
                  <button type="button" className="mv-tab" role="tab" aria-selected="true">
                    Ongoing
                  </button>
                  <button type="button" className="mv-tab" role="tab" aria-selected="false">
                    Upcoming
                  </button>
                </div>
              </article>

              <article className={styles.componentCard}>
                <span className={styles.componentLabel}>Field</span>
                <div className={styles.fieldDemo}>
                  <label htmlFor="preview-search">Search members</label>
                  <input
                    id="preview-search"
                    className="mv-field"
                    placeholder="Name, coach, or membership"
                  />
                </div>
              </article>
            </div>
          </section>

          <section className={styles.section} aria-labelledby="metrics-title">
            <header className={styles.sectionHeader}>
              <span className={styles.sectionNumber}>04</span>
              <h2 id="metrics-title">Data surfaces</h2>
            </header>
            <PageHeader
              eyebrow="Admin overview"
              title="Dashboard Summary"
              description="Real priorities, capacity, and member activity for the current studio day."
              actions={
                <button type="button" className="mv-btn mv-btn-secondary">
                  Last 7 days
                </button>
              }
            />
            <div className={`${styles.metricGrid} mt-5`}>
              <MetricCard
                label="Active members"
                value="248"
                change="+12"
                detail="this month"
                icon={Users}
                tone="brand"
              />
              <MetricCard
                label="Sessions this week"
                value="34"
                change="On track"
                detail="with confirmed coaches"
                icon={CalendarDays}
              />
              <MetricCard
                label="Attendance"
                value="92%"
                change="+4%"
                detail="against last week"
                icon={TrendingUp}
                tone="warning"
              />
            </div>
            <EmptyState
              className="mt-5"
              title="No alerts need attention"
              description="Operational alerts will appear here when billing, capacity, or renewal follow-up is required."
              icon={Bell}
              action={<button className="mv-btn mv-btn-secondary">Open notifications</button>}
            />
          </section>
        </div>
      </div>
    </main>
  );
}
