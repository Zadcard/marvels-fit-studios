import type { AdminOverviewStat } from "@/lib/mocks/admin-overview";
import type { AdminStudioSettings } from "@/lib/mocks/admin-settings";
import styles from "./marvel-ops-expansion.module.css";

export function MarvelOpsReports({ stats }: { stats: AdminOverviewStat[] }) {
  return <div className={styles.page}><section className={styles.kpis} aria-label="Report summary">{stats.map((stat) => <article key={stat.id}><span>{stat.label}</span><strong>{stat.value}</strong><small data-tone={stat.tone}>{stat.change}</small></article>)}</section><section className={styles.panel}><header><h2>Live studio report</h2><span>Database-backed operational summary</span></header><div className={styles.progressList}>{stats.map((stat) => <div key={`${stat.id}-detail`}><span>{stat.label}</span><b>{stat.detail}</b><i><em data-tone={stat.tone} style={{ width: "100%" }} /></i></div>)}</div></section></div>;
}

export function MarvelOpsSettings({ settings }: { settings: AdminStudioSettings }) {
  const fields = [["Studio name", settings.studioName], ["Support email", settings.supportEmail], ["Support phone", settings.supportPhone], ["Timezone", settings.timezone], ["Default session", settings.defaultSessionLength], ["Intake lead time", settings.intakeLeadTime], ["Cancellation window", settings.cancellationWindow], ["Private session buffer", settings.privateSessionBuffer], ["Schedule starts", settings.scheduleStartDay]];
  return <div className={styles.settingsLayout}><section className={styles.settingsPanel}><header><div><h2>Studio settings</h2><p>Current values stored in the studio settings record.</p></div></header><div className={styles.settingsBody}><div className={styles.fieldGrid}>{fields.map(([label, value]) => <label key={label}>{label}<input value={value} readOnly /></label>)}<label className={styles.full}>Overbook waitlist<input value={settings.overbookWaitlist ? "Enabled" : "Disabled"} readOnly /></label></div></div><footer><span>Editing will be connected to the settings action next.</span><button type="button" disabled>Save changes</button></footer></section></div>;
}
