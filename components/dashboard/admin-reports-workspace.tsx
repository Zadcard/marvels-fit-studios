"use client";

import { BanknoteArrowDown, BanknoteArrowUp, Download, Scale } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { AdminCashInDialog } from "@/components/dashboard/admin-cash-in-dialog";
import { AdminCashOutDialog } from "@/components/dashboard/admin-cash-out-dialog";
import type {
  AdminReportData,
  AdminReportBreakdown,
  AdminReportDailyPoint,
} from "@/lib/dashboard/admin-report-data";
import styles from "./admin-reports-workspace.module.css";

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "EGP", maximumFractionDigits: 0 });

const rangePresets = [
  { label: "Week", days: 6 },
  { label: "Month", days: 29 },
  { label: "Quarter", days: 89 },
] as const;

function addDaysToDateOnly(value: string, days: number) {
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function Breakdown({ title, items, empty }: { title: string; items: AdminReportBreakdown[]; empty: string }) {
  const max = Math.max(1, ...items.map((item) => item.amount));
  return <section className={styles.panel}><header><h2>{title}</h2></header><div className={styles.breakdown}>{items.length ? items.map((item) => <div key={item.key}><span>{item.label}<small>{item.count} entries</small></span><b>{money.format(item.amount)}</b><i><em style={{ width: `${item.amount / max * 100}%` }} /></i></div>) : <p className={styles.empty}>{empty}</p>}</div></section>;
}

const CHART_WIDTH = 940;
const CHART_HEIGHT = 220;
const CHART_PAD_X = 14;
const CHART_PAD_Y = 18;

function CashLinesChart({ daily }: { daily: AdminReportDailyPoint[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...daily.flatMap((point) => [point.income, point.expenses]));
  const count = daily.length;
  const x = (index: number) =>
    count <= 1
      ? CHART_WIDTH / 2
      : CHART_PAD_X + (index * (CHART_WIDTH - CHART_PAD_X * 2)) / (count - 1);
  const y = (value: number) =>
    CHART_HEIGHT - CHART_PAD_Y - (value / max) * (CHART_HEIGHT - CHART_PAD_Y * 2);
  const line = (valueFor: (point: AdminReportDailyPoint) => number) =>
    daily.map((point, index) => `${x(index)},${y(valueFor(point))}`).join(" ");
  const columnWidth = count ? (CHART_WIDTH - CHART_PAD_X * 2) / Math.max(1, count - 1) : 0;
  const hovered = hover === null ? null : daily[hover];

  if (!count) return <p className={styles.empty}>No days in this range.</p>;

  return (
    <div className={styles.chartWrap}>
      <svg
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        preserveAspectRatio="none"
        role="img"
        aria-label="Cash in and cash out per day"
        onMouseLeave={() => setHover(null)}
      >
        <polyline className={styles.lineIn} points={line((point) => point.income)} />
        <polyline className={styles.lineOut} points={line((point) => point.expenses)} />
        {hover !== null ? (
          <line
            className={styles.hoverLine}
            x1={x(hover)}
            x2={x(hover)}
            y1={CHART_PAD_Y / 2}
            y2={CHART_HEIGHT - CHART_PAD_Y / 2}
          />
        ) : null}
        {hovered !== null && hover !== null ? (
          <>
            <circle className={styles.dotIn} cx={x(hover)} cy={y(hovered.income)} r={5} />
            <circle className={styles.dotOut} cx={x(hover)} cy={y(hovered.expenses)} r={5} />
          </>
        ) : null}
        {daily.map((point, index) => (
          <rect
            key={point.date}
            x={x(index) - columnWidth / 2}
            y={0}
            width={Math.max(columnWidth, 8)}
            height={CHART_HEIGHT}
            fill="transparent"
            onMouseEnter={() => setHover(index)}
          >
            <title>{`${point.date}: ${money.format(point.income)} in · ${money.format(point.expenses)} out`}</title>
          </rect>
        ))}
      </svg>
      {hovered !== null && hover !== null ? (
        <div
          className={styles.chartTip}
          style={{ left: `${(x(hover) / CHART_WIDTH) * 100}%` }}
        >
          <strong>{hovered.date}</strong>
          <span className={styles.tipIn}>Cash in {money.format(hovered.income)}</span>
          <span className={styles.tipOut}>Cash out {money.format(hovered.expenses)}</span>
        </div>
      ) : null}
      <div className={styles.chartAxis}>
        <small>{daily[0].date}</small>
        <small>{daily[daily.length - 1].date}</small>
      </div>
    </div>
  );
}

export function AdminReportsWorkspace({
  data,
  clientOptions = [],
}: {
  data: AdminReportData;
  clientOptions?: Array<{ id: string; fullName: string }>;
}) {
  const router = useRouter();
  const exportHref = `/api/reports/operations?from=${encodeURIComponent(data.range.from)}&to=${encodeURIComponent(data.range.to)}`;

  const activePreset = rangePresets.find(
    (preset) => addDaysToDateOnly(data.range.to, -preset.days) === data.range.from,
  )?.label;

  return <div className={styles.page}>
    <section className={styles.toolbar}>
      <div className={styles.rangeToggle}>{rangePresets.map((preset) => (
        <button
          key={preset.label}
          type="button"
          data-active={activePreset === preset.label || undefined}
          onClick={() => router.push(`/admin/reports?from=${addDaysToDateOnly(data.range.to, -preset.days)}&to=${data.range.to}`)}
        >
          {preset.label}
        </button>
      ))}</div>
      <form method="get" action="/admin/reports"><label>From<input name="from" type="date" defaultValue={data.range.from} /></label><label>To<input name="to" type="date" defaultValue={data.range.to} /></label><button type="submit">Apply range</button></form>
      <a href={exportHref}><Download size={15} /> Export CSV</a>
      <AdminCashInDialog clientOptions={clientOptions} />
      <AdminCashOutDialog />
    </section>

    <section className={styles.kpis} aria-label="Report summary">
      <article><span><BanknoteArrowUp size={15} /> Cash in</span><strong>{money.format(data.summary.income)}</strong><small>{data.summary.paymentCount} {data.summary.paymentCount === 1 ? "payment" : "payments"}</small></article>
      <article><span><BanknoteArrowDown size={15} /> Cash out</span><strong>{money.format(data.summary.expenses)}</strong><small>Posted cash out</small></article>
      <article data-tone={data.summary.net >= 0 ? "positive" : "negative"}><span><Scale size={15} /> Net</span><strong>{money.format(data.summary.net)}</strong><small>Cash in minus cash out</small></article>
    </section>

    <section className={styles.panel}><header><div><h2>Daily cash movement</h2><p>{data.range.from} through {data.range.to} &middot; {data.range.timezone}</p></div><span>Green line cash in &middot; red line cash out</span></header><CashLinesChart daily={data.daily} /></section>

    <div className={styles.twoColumns}><Breakdown title="Cash in by payment method" items={data.paymentMethods} empty="No payments in this range." /><Breakdown title="Cash out by category" items={data.expenseCategories} empty="No posted cash out in this range." /></div>
  </div>;
}
