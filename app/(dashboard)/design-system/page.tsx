import Image from "next/image";
import { ArrowUpRight, Bell, TrendingUp } from "lucide-react";

import { DashboardStatCard } from "@/components/dashboard/dashboard-stat-card";

import styles from "./page.module.css";

export const metadata = {
  title: "Design System Preview",
};

type Token = {
  name: string;
  value: string;
  role: string;
};

const tokenGroups: Array<{ label: string; tokens: Token[] }> = [
  {
    label: "Layer",
    tokens: [
      { name: "--mv-canvas", value: "#0A0A0B", role: "Page background" },
      { name: "--mv-canvas-alt", value: "#1B1B1C", role: "Alternate canvas" },
      { name: "--mv-panel", value: "#0C0C0D", role: "Primary panel" },
      { name: "--mv-surface", value: "#161618", role: "Nested surface" },
      { name: "--mv-surface-2", value: "#222225", role: "Raised control" },
    ],
  },
  {
    label: "Brand",
    tokens: [
      { name: "--mv-primary", value: "#E62429", role: "Brand red" },
      { name: "--mv-primary-deep", value: "#B91C21", role: "Pressed state" },
      { name: "--mv-primary-bright", value: "#FF5A5E", role: "Live data stroke" },
      { name: "--mv-primary-tint", value: "#FF6B6E", role: "Negative delta" },
      { name: "--mv-primary-wash", value: "rgba(230,36,41,0.14)", role: "Icon wash" },
    ],
  },
  {
    label: "Data",
    tokens: [
      { name: "--mv-rose", value: "#FFD9D8", role: "Featured data" },
      { name: "--mv-rose-deep", value: "#F3C9C8", role: "Featured endpoint" },
      { name: "--mv-mint", value: "#DCEFE2", role: "Positive series" },
      { name: "--mv-lavender", value: "#E7E2F7", role: "Optional series" },
      { name: "--mv-peach", value: "#FBE8CE", role: "Optional series" },
    ],
  },
  {
    label: "Text & lines",
    tokens: [
      { name: "--mv-text", value: "#FFFFFF", role: "Primary text" },
      { name: "--mv-text-2", value: "#C9C4C4", role: "Secondary text" },
      { name: "--mv-muted", value: "#928C8C", role: "Muted label" },
      { name: "--mv-muted-2", value: "#6E6868", role: "Micro label" },
      { name: "--mv-line", value: "rgba(255,255,255,0.06)", role: "Divider" },
      { name: "--mv-line-strong", value: "rgba(255,255,255,0.10)", role: "Input border" },
      { name: "--mv-control", value: "rgba(255,255,255,0.05)", role: "Ghost control" },
      { name: "--mv-control-hover", value: "rgba(255,255,255,0.10)", role: "Ghost hover" },
    ],
  },
  {
    label: "Semantic",
    tokens: [
      { name: "--mv-success", value: "#7ED9A2", role: "Positive delta" },
      { name: "--mv-danger", value: "#FF6B6E", role: "Negative delta" },
    ],
  },
];

const radii = [
  ["--r-icon", "11px"],
  ["--r-chip", "12px"],
  ["--r-control", "14px"],
  ["--r-surface", "20px"],
  ["--r-panel", "22px"],
  ["--r-panel-lg", "28px"],
  ["--r-pill", "999px"],
] as const;

export default function DesignSystemPreviewPage() {
  return (
    <main className={styles.page} data-design-system-preview>
      <header className={styles.hero}>
        <div className={styles.brand}>
          <Image
            src="/img/Logo-1.png"
            alt="Marvel's Fit Studios logo"
            width={38}
            height={38}
            priority
          />
          <span>Marvel&apos;s Fit Studios</span>
        </div>
        <div>
          <p className={styles.eyebrow}>Visual system v2 · Palette checkpoint</p>
          <h1>Dark ink. Marvel red. Pastel data.</h1>
          <p className={styles.heroCopy}>
            Exact handoff tokens and the shared Button, KPI card, and Panel
            contracts—shown before any production screen reconstruction.
          </p>
        </div>
      </header>

      <section className={styles.section} aria-labelledby="palette-title">
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.microLabel}>Foundation</p>
            <h2 id="palette-title">Token palette</h2>
          </div>
          <p>Exact names and values from the handoff README.</p>
        </div>

        <div className={styles.tokenGroups}>
          {tokenGroups.map((group) => (
            <article className={styles.tokenGroup} key={group.label}>
              <h3>{group.label}</h3>
              <ul className={styles.tokenGrid}>
                {group.tokens.map((token) => (
                  <li className={styles.tokenCard} key={token.name}>
                    <span
                      className={styles.swatch}
                      style={{ background: token.value }}
                      aria-hidden="true"
                    />
                    <span className={styles.tokenCopy}>
                      <code>{token.name}</code>
                      <strong>{token.value}</strong>
                      <small>{token.role}</small>
                    </span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.section} aria-labelledby="components-title">
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.microLabel}>Shared contracts</p>
            <h2 id="components-title">Base components</h2>
          </div>
          <p>One red CTA. Pastel is reserved for data. Every surface is flat.</p>
        </div>

        <div className={styles.componentGrid}>
          <article className={`dashboard-panel ${styles.componentPanel}`}>
            <div className={styles.componentHeading}>
              <p className={styles.microLabel}>Button</p>
              <h3>Clear hierarchy, quiet support</h3>
            </div>
            <div className={styles.buttonRow}>
              <button className="mv-btn mv-btn-primary" type="button" data-red-cta>
                Primary action
                <ArrowUpRight size={16} />
              </button>
              <button className="mv-btn mv-btn-secondary" type="button">
                Secondary
              </button>
              <button className="mv-btn mv-btn-outline" type="button">
                Outline
              </button>
              <button className="mv-icon-btn" type="button" aria-label="Open notifications">
                <Bell size={17} />
              </button>
            </div>
          </article>

          <DashboardStatCard
            label="Attendance consistency"
            value="86%"
            change="+11.2%"
            detail="A positive training signal represented with data-only mint."
            note="vs. last month"
            icon={TrendingUp}
            tone="success"
          />

          <article className={`dashboard-panel ${styles.layerDemo}`}>
            <div className={styles.componentHeading}>
              <p className={styles.microLabel}>Panel</p>
              <h3>Contrast separates the layers</h3>
              <p>No border and no drop shadow between panel and surface.</p>
            </div>
            <div className={styles.nestedSurface} data-layer="surface">
              <span className={styles.surfaceIcon} aria-hidden="true">
                <TrendingUp size={18} />
              </span>
              <div>
                <strong>Nested operational surface</strong>
                <p>Canvas → panel → surface → raised control.</p>
              </div>
              <span className={styles.ghostControl}>Live data</span>
            </div>
          </article>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="system-title">
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.microLabel}>System scales</p>
            <h2 id="system-title">Radius and layering proof</h2>
          </div>
        </div>

        <div className={styles.proofGrid}>
          <article className={styles.radiusPanel}>
            <h3>Radius tokens</h3>
            <div className={styles.radiusList}>
              {radii.map(([name, value]) => (
                <div className={styles.radiusItem} key={name}>
                  <span style={{ borderRadius: value }} aria-hidden="true" />
                  <code>{name}</code>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
          </article>

          <article className={styles.layerStack} data-flat-surface>
            <div className={styles.canvasLayer}>
              <span>Canvas · #0A0A0B</span>
              <div className={styles.panelLayer}>
                <span>Panel · #0C0C0D</span>
                <div className={styles.surfaceLayer}>
                  <span>Surface · #161618</span>
                  <span className={styles.surfaceTwoLayer}>Surface 2 · #222225</span>
                </div>
              </div>
            </div>
          </article>
        </div>
      </section>

      <aside className={styles.ruleStrip} aria-label="Visual system enforcement rules">
        <span><strong>1</strong> Contrast-only layering</span>
        <span><strong>1</strong> Red CTA in this checkpoint</span>
        <span><strong>Data</strong> Pastels never speak</span>
        <span><strong>0</strong> Drop shadows</span>
      </aside>
    </main>
  );
}
