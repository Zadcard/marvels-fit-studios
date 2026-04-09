import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.join(__dirname, "..");
const dashboardDir = path.join(workspaceRoot, "components", "dashboard");

const componentFiles = [
  "admin-clients-workspace.tsx",
  "admin-leads-workspace.tsx",
  "client-coach-workspace.tsx",
  "client-overview-workspace.tsx",
  "client-sessions-workspace.tsx",
  "client-settings-workspace.tsx",
  "client-subscription-workspace.tsx",
  "coach-clients-workspace.tsx",
  "coach-overview-workspace.tsx",
  "coach-schedule-workspace.tsx",
  "coach-sessions-workspace.tsx",
  "coach-settings-workspace.tsx",
];

for (const fileName of componentFiles) {
  const filePath = path.join(dashboardDir, fileName);
  const source = readFileSync(filePath, "utf8");

  assert.match(
    source,
    /DashboardMiniStat/,
    `${fileName} should use the shared DashboardMiniStat primitive.`
  );
  assert.doesNotMatch(
    source,
    /dashboard-mini-stat__label|className="dashboard-mini-stat"/,
    `${fileName} should not contain raw dashboard mini-stat markup anymore.`
  );
}

const primitiveSource = readFileSync(
  path.join(dashboardDir, "dashboard-mini-stat.tsx"),
  "utf8"
);

assert.match(
  primitiveSource,
  /"dashboard-mini-stat"/,
  "DashboardMiniStat should own the mini-stat markup."
);

const adminOverviewPage = readFileSync(
  path.join(workspaceRoot, "app", "(dashboard)", "admin", "page.tsx"),
  "utf8"
);
const adminLeadsWorkspace = readFileSync(
  path.join(workspaceRoot, "components", "dashboard", "admin-leads-workspace.tsx"),
  "utf8"
);
const adminClientsWorkspace = readFileSync(
  path.join(workspaceRoot, "components", "dashboard", "admin-clients-workspace.tsx"),
  "utf8"
);
const adminCoachesWorkspace = readFileSync(
  path.join(workspaceRoot, "components", "dashboard", "admin-coaches-workspace.tsx"),
  "utf8"
);
const adminSessionsWorkspace = readFileSync(
  path.join(workspaceRoot, "components", "dashboard", "admin-sessions-workspace.tsx"),
  "utf8"
);
const adminSubscriptionsWorkspace = readFileSync(
  path.join(
    workspaceRoot,
    "components",
    "dashboard",
    "admin-subscriptions-workspace.tsx"
  ),
  "utf8"
);
const adminProfileWorkspace = readFileSync(
  path.join(workspaceRoot, "components", "dashboard", "admin-profile-workspace.tsx"),
  "utf8"
);
const adminSettingsWorkspace = readFileSync(
  path.join(workspaceRoot, "components", "dashboard", "admin-settings-workspace.tsx"),
  "utf8"
);

assert.match(
  adminOverviewPage,
  /DashboardSurfaceNote/,
  "Admin overview page should use the shared DashboardSurfaceNote component."
);
assert.match(
  adminOverviewPage,
  /DashboardMiniStat/,
  "Admin overview page should use the shared DashboardMiniStat component."
);
assert.match(
  adminOverviewPage,
  /dashboard-admin-priority-grid/,
  "Admin overview page should keep a dedicated admin priority mini-stat row."
);
assert.match(
  adminOverviewPage,
  /dashboard-overview-grid dashboard-overview-grid--admin/,
  "Admin overview page should keep a dedicated admin operational grid."
);
assert.match(
  adminOverviewPage,
  /dashboard-secondary-grid dashboard-secondary-grid--admin/,
  "Admin overview page should keep a dedicated admin secondary grid."
);
assert.doesNotMatch(
  adminOverviewPage,
  /dashboard-quick-card|dashboard-snapshot-item/,
  "Admin overview page should not use the old quick-card or snapshot-card mosaic."
);
assert.match(
  adminOverviewPage,
  /dashboard-admin-action-row|dashboard-admin-snapshot-row/,
  "Admin overview page should use the flattened admin-only action and snapshot layouts."
);
assert.match(
  adminOverviewPage,
  /DashboardEmptyState/,
  "Admin overview page should define explicit empty states for sections that can be empty."
);
assert.match(
  adminLeadsWorkspace,
  /DashboardSurfaceNote/,
  "Admin leads workspace should keep a shared briefing note."
);
assert.match(
  adminLeadsWorkspace,
  /DashboardManagementToolbar/,
  "Admin leads workspace should keep the shared management toolbar."
);
assert.match(
  adminLeadsWorkspace,
  /dashboard-lead-table__status|dashboard-lead-table__message/,
  "Admin leads workspace should use the denser lead review row treatments."
);
assert.match(
  adminLeadsWorkspace,
  /DashboardEmptyState/,
  "Admin leads workspace should define an explicit filtered empty state."
);
assert.match(
  adminClientsWorkspace,
  /DashboardSurfaceNote/,
  "Admin clients workspace should keep a shared briefing note."
);
assert.match(
  adminClientsWorkspace,
  /DashboardMiniStat/,
  "Admin clients workspace should use the shared DashboardMiniStat primitive."
);
assert.match(
  adminClientsWorkspace,
  /dashboard-client-table__program|dashboard-client-table__billing|dashboard-client-table__readiness/,
  "Admin clients workspace should use the denser client roster row treatments."
);
assert.match(
  adminClientsWorkspace,
  /DashboardEmptyState/,
  "Admin clients workspace should define an explicit filtered empty state."
);
assert.match(
  adminCoachesWorkspace,
  /DashboardSurfaceNote/,
  "Admin coaches workspace should keep a shared briefing note."
);
assert.match(
  adminCoachesWorkspace,
  /DashboardMiniStat/,
  "Admin coaches workspace should use the shared DashboardMiniStat primitive."
);
assert.match(
  adminCoachesWorkspace,
  /dashboard-coach-table__specialization|dashboard-coach-table__load/,
  "Admin coaches workspace should use the denser coach coverage row treatments."
);
assert.match(
  adminCoachesWorkspace,
  /DashboardEmptyState/,
  "Admin coaches workspace should define an explicit filtered empty state."
);
assert.match(
  adminSessionsWorkspace,
  /DashboardSurfaceNote/,
  "Admin sessions workspace should keep a shared briefing note."
);
assert.match(
  adminSessionsWorkspace,
  /DashboardMiniStat/,
  "Admin sessions workspace should use the shared DashboardMiniStat primitive."
);
assert.match(
  adminSessionsWorkspace,
  /dashboard-session-table__status|dashboard-session-table__capacity|dashboard-session-table__client|dashboard-session-table__timing/,
  "Admin sessions workspace should use the denser session coverage and roster row treatments."
);
assert.match(
  adminSessionsWorkspace,
  /DashboardEmptyState/,
  "Admin sessions workspace should define explicit filtered empty states."
);
assert.match(
  adminSubscriptionsWorkspace,
  /DashboardSurfaceNote/,
  "Admin subscriptions workspace should keep a shared briefing note."
);
assert.match(
  adminSubscriptionsWorkspace,
  /DashboardMiniStat/,
  "Admin subscriptions workspace should use the shared DashboardMiniStat primitive."
);
assert.match(
  adminSubscriptionsWorkspace,
  /dashboard-subscription-table__plan|dashboard-subscription-table__status|dashboard-subscription-table__billing/,
  "Admin subscriptions workspace should use the denser subscription billing row treatments."
);
assert.match(
  adminSubscriptionsWorkspace,
  /DashboardEmptyState/,
  "Admin subscriptions workspace should define explicit filtered empty states."
);
assert.match(
  adminProfileWorkspace,
  /DashboardSurfaceNote/,
  "Admin profile workspace should keep a shared briefing note."
);
assert.match(
  adminProfileWorkspace,
  /DashboardMiniStat/,
  "Admin profile workspace should use the shared DashboardMiniStat primitive."
);
assert.doesNotMatch(
  adminProfileWorkspace,
  /dashboard-profile-metric/,
  "Admin profile workspace should avoid one-off metric card markup."
);
assert.match(
  adminSettingsWorkspace,
  /DashboardSurfaceNote/,
  "Admin settings workspace should keep a shared briefing note."
);
assert.match(
  adminSettingsWorkspace,
  /DashboardMiniStat/,
  "Admin settings workspace should use the shared DashboardMiniStat primitive."
);
assert.match(
  adminSettingsWorkspace,
  /Save state|Waitlist mode|Notification defaults/,
  "Admin settings workspace should expose a compact priority summary row."
);

const adminLoadingPage = readFileSync(
  path.join(workspaceRoot, "app", "(dashboard)", "admin", "loading.tsx"),
  "utf8"
);
assert.match(
  adminLoadingPage,
  /DashboardRouteLoading/,
  "Admin overview route should provide a dashboard loading state."
);

const adminErrorPage = readFileSync(
  path.join(workspaceRoot, "app", "(dashboard)", "admin", "error.tsx"),
  "utf8"
);
assert.match(
  adminErrorPage,
  /DashboardRouteError/,
  "Admin overview route should provide a dashboard error state."
);

console.log("dashboard mini-stat adoption checks passed");
