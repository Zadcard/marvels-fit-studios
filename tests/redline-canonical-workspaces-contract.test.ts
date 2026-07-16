import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("REDLINE canonical admin workspaces", () => {
  it("owns the member directory without legacy dashboard primitives", () => {
    const workspace = read("components/dashboard/admin-clients-workspace.tsx");
    const styles = read(
      "components/dashboard/admin-clients-workspace.module.css",
    );

    expect(workspace).toContain("Know every member");
    expect(workspace).toContain("saveAdminClient");
    expect(workspace).toContain("deleteAdminClient");
    expect(workspace).toContain("<Dialog.Portal>");
    expect(workspace).toContain("useSearchParams");
    expect(workspace).not.toContain("DashboardMiniStat");
    expect(workspace).not.toContain("DashboardSurfaceNote");
    expect(styles).toContain("var(--rl-red)");
    expect(styles).toContain("@media (max-width: 700px)");
  });

  it("owns a functional weekly schedule connected to existing actions", () => {
    const workspace = read("components/dashboard/admin-schedule-workspace.tsx");
    const page = read("app/(dashboard)/admin/schedule/page.tsx");
    const repository = read("lib/repositories/admin-schedule-repository.ts");
    const styles = read(
      "components/dashboard/admin-schedule-workspace.module.css",
    );

    expect(workspace).toContain("Program the week");
    expect(workspace).toContain("saveAdminSession");
    expect(workspace).toContain("cancelAdminSession");
    expect(workspace).toContain("bulkUpdateAdminSessions");
    expect(workspace).toContain("navigateWeek");
    expect(workspace).toContain("navigateToday");
    expect(workspace).toContain("<Dialog.Portal>");
    expect(page).toContain("searchParams.week");
    expect(repository).toContain("input?.weekStart");
    expect(styles).toContain("var(--session-top)");
    expect(styles).toContain("@media (max-width: 700px)");
  });

  it("owns the session ledger and every existing session mutation", () => {
    const workspace = read("components/dashboard/admin-sessions-workspace.tsx");
    const styles = read(
      "components/dashboard/admin-sessions-workspace.module.css",
    );

    expect(workspace).toContain("Run every block");
    expect(workspace).toContain("saveAdminSession");
    expect(workspace).toContain("cancelAdminSession");
    expect(workspace).toContain("deleteAdminSession");
    expect(workspace).toContain("assignClientToSession");
    expect(workspace).toContain("removeClientFromSession");
    expect(workspace).toContain("markAttendance");
    expect(workspace).toContain("<Dialog.Portal>");
    expect(workspace).not.toContain("DashboardManagementToolbar");
    expect(styles).toContain("var(--rl-red)");
    expect(styles).not.toContain("var(--mv-");
    expect(styles).toContain("@media(max-width:700px)");
  });

  it("owns the intake decision queue and secure approval handoff", () => {
    const workspace = read("components/dashboard/admin-leads-workspace.tsx");
    const styles = read(
      "components/dashboard/admin-leads-workspace.module.css",
    );
    expect(workspace).toContain("Choose who joins");
    expect(workspace).toContain("approveLeadAsClient");
    expect(workspace).toContain("deleteLead");
    expect(workspace).toContain("temporaryPassword");
    expect(workspace).toContain("useSearchParams");
    expect(workspace).toContain("<Dialog.Portal>");
    expect(workspace).not.toContain("DashboardModal");
    expect(styles).toContain("var(--rl-red)");
    expect(styles).not.toContain("var(--mv-");
  });

  it("owns the admin identity surface and removes the redirected billing relic", () => {
    const workspace = read("components/dashboard/admin-profile-workspace.tsx");
    const styles = read(
      "components/dashboard/admin-profile-workspace.module.css",
    );
    expect(workspace).toContain("Own the controls");
    expect(workspace).toContain("saveAdminProfile");
    expect(workspace).toContain('href="/change-password"');
    expect(workspace).not.toContain("DashboardPageHeader");
    expect(workspace).not.toContain("AccountSecurityPanel");
    expect(styles).toContain("var(--rl-red)");
    expect(() =>
      read("components/dashboard/admin-subscriptions-workspace.tsx"),
    ).toThrow();
  });

  it("owns the persisted studio rules console", () => {
    const workspace = read("components/dashboard/admin-settings-workspace.tsx");
    const styles = read(
      "components/dashboard/admin-settings-workspace.module.css",
    );
    expect(workspace).toContain("Set the operating code");
    expect(workspace).toContain("saveSettingsAction");
    expect(workspace).toContain("overbookWaitlist");
    expect(workspace).not.toContain("DashboardFormSection");
    expect(workspace).not.toContain("DashboardSwitch");
    expect(styles).toContain("var(--rl-red)");
    expect(styles).not.toContain("var(--mv-");
  });

  it("owns the roster import pipeline without legacy dashboard styling", () => {
    const workspace = read(
      "components/dashboard/admin-bulk-import-workspace.tsx",
    );
    const styles = read(
      "components/dashboard/admin-bulk-import-workspace.module.css",
    );

    expect(workspace).toContain("Move the roster in");
    expect(workspace).toContain("previewClientImportCSV");
    expect(workspace).toContain("importClientCSV");
    expect(workspace).toContain("credentialsCsv");
    expect(workspace).toContain("Download template");
    expect(workspace).not.toContain("DashboardManagementToolbar");
    expect(workspace).not.toContain("DashboardMiniStat");
    expect(styles).toContain("var(--rl-red)");
    expect(styles).not.toContain("var(--mv-");
    expect(styles).toContain("@media (max-width: 700px)");
  });

  it("owns the coach command board without legacy dashboard primitives", () => {
    const workspace = read("components/dashboard/coach-overview-workspace.tsx");
    const styles = read(
      "components/dashboard/coach-overview-workspace.module.css",
    );

    expect(workspace).toContain("Own the next rep");
    expect(workspace).toContain("data.upcomingSessions");
    expect(workspace).toContain("data.clientSpotlights");
    expect(workspace).toContain("data.recentActivity");
    expect(workspace).not.toContain("DashboardMiniStat");
    expect(workspace).not.toContain("DashboardPageHeader");
    expect(styles).toContain("var(--rl-red)");
    expect(styles).not.toContain("var(--mv-");
    expect(styles).toContain("@media (max-width: 700px)");
  });

  it("owns the coach weekly calendar and its live filters", () => {
    const workspace = read("components/dashboard/coach-schedule-workspace.tsx");
    const styles = read(
      "components/dashboard/coach-schedule-workspace.module.css",
    );

    expect(workspace).toContain("See the whole week");
    expect(workspace).toContain("coachScheduleStatusFilters");
    expect(workspace).toContain("setView");
    expect(workspace).toContain("setStatus");
    expect(workspace).not.toContain("DashboardManagementToolbar");
    expect(workspace).not.toContain("DashboardPaginationControls");
    expect(styles).toContain("var(--rl-red)");
    expect(styles).not.toContain("var(--mv-");
    expect(styles).toContain("@media (max-width: 700px)");
  });

  it("owns the persisted coach identity and secure access handoff", () => {
    const workspace = read("components/dashboard/coach-settings-workspace.tsx");
    const styles = read(
      "components/dashboard/coach-settings-workspace.module.css",
    );

    expect(workspace).toContain("Shape your coaching identity");
    expect(workspace).toContain("saveCoachSettings");
    expect(workspace).toContain('href="/change-password"');
    expect(workspace).not.toContain("DashboardFormSection");
    expect(workspace).not.toContain("AccountSecurityPanel");
    expect(styles).toContain("var(--rl-red)");
    expect(styles).not.toContain("var(--mv-");
    expect(styles).toContain("@media (max-width: 700px)");
  });

  it("owns the coach performance lab and every transformation mutation", () => {
    const workspace = read(
      "components/dashboard/coach-transformation-workspace.tsx",
    );
    const styles = read(
      "components/dashboard/coach-transformation-workspace.module.css",
    );

    expect(workspace).toContain("Engineer the outcome");
    expect(workspace).toContain("saveClientAssessment");
    expect(workspace).toContain("saveClientGoal");
    expect(workspace).toContain("saveTrainingProgram");
    expect(workspace).toContain("addProgramWorkout");
    expect(workspace).toContain("createExercise");
    expect(workspace).toContain("addWorkoutExercise");
    expect(workspace).toContain("recordWorkoutPerformance");
    expect(workspace).toContain("addProgressMetric");
    expect(workspace).toContain("respondToClientCheckIn");
    expect(workspace).not.toContain("DashboardFormSection");
    expect(workspace).not.toContain("DashboardMiniStat");
    expect(styles).toContain("var(--rl-red)");
    expect(styles).not.toContain("var(--mv-");
    expect(styles).toContain("@media (max-width: 700px)");
  });

  it("owns the member home and preserves private notes and coach files", () => {
    const workspace = read(
      "components/dashboard/client-overview-workspace.tsx",
    );
    const styles = read(
      "components/dashboard/client-overview-workspace.module.css",
    );

    expect(workspace).toContain("Train with a clear next step");
    expect(workspace).toContain("saveClientPrivateNote");
    expect(workspace).toContain("data.activeFiles");
    expect(workspace).toContain("<Dialog.Portal>");
    expect(workspace).not.toContain("DashboardModal");
    expect(workspace).not.toContain("DashboardMiniStat");
    expect(styles).toContain("var(--rl-red)");
    expect(styles).not.toContain("var(--mv-");
    expect(styles).toContain("@media (max-width: 700px)");
  });

  it("owns the member session ledger and detail readout", () => {
    const workspace = read(
      "components/dashboard/client-sessions-workspace.tsx",
    );
    const styles = read(
      "components/dashboard/client-sessions-workspace.module.css",
    );

    expect(workspace).toContain("Know every session");
    expect(workspace).toContain("clientSessionPeriodFilters");
    expect(workspace).toContain("clientSessionTypeFilters");
    expect(workspace).toContain("<Dialog.Portal>");
    expect(workspace).not.toContain("DashboardManagementToolbar");
    expect(workspace).not.toContain("DashboardModal");
    expect(styles).toContain("var(--rl-red)");
    expect(styles).not.toContain("var(--mv-");
    expect(styles).toContain("@media (max-width: 700px)");
  });

  it("owns the member coach relationship and direct contact card", () => {
    const workspace = read("components/dashboard/client-coach-workspace.tsx");
    const styles = read(
      "components/dashboard/client-coach-workspace.module.css",
    );
    expect(workspace).toContain("Your person on the floor");
    expect(workspace).toContain("href={`tel:${data.phone}`}");
    expect(workspace).toContain("href={`mailto:${data.email}`}");
    expect(workspace).not.toContain("DashboardMiniStat");
    expect(workspace).not.toContain("DashboardSurfaceNote");
    expect(styles).toContain("var(--rl-red)");
    expect(styles).not.toContain("var(--mv-");
  });

  it("owns the member progress cockpit and preserves live readiness check-ins", () => {
    const workspace = read(
      "components/dashboard/client-progress-workspace.tsx",
    );
    const styles = read(
      "components/dashboard/client-progress-workspace.module.css",
    );

    expect(workspace).toContain("Build proof, not guesses");
    expect(workspace).toContain("submitClientCheckIn");
    expect(workspace).toContain("data.programs");
    expect(workspace).toContain("data.goals");
    expect(workspace).toContain("data.metrics");
    expect(workspace).toContain("data.checkIns");
    expect(workspace).toContain("data.workoutLogs");
    expect(workspace).not.toContain("DashboardFormSection");
    expect(workspace).not.toContain("DashboardMiniStat");
    expect(styles).toContain("var(--rl-red)");
    expect(styles).not.toContain("var(--mv-");
    expect(styles).toContain("@media (max-width: 700px)");
  });

  it("owns the member subscription pass and keeps receipt access", () => {
    const workspace = read(
      "components/dashboard/client-subscription-workspace.tsx",
    );
    const styles = read(
      "components/dashboard/client-subscription-workspace.module.css",
    );

    expect(workspace).toContain("Know what you own");
    expect(workspace).toContain("data.paymentHistory");
    expect(workspace).toContain("payment.receiptHref");
    expect(workspace).toContain("data.benefits");
    expect(workspace).not.toContain("DashboardMiniStat");
    expect(workspace).not.toContain("DashboardSurfaceNote");
    expect(styles).toContain("var(--rl-red)");
    expect(styles).not.toContain("var(--mv-");
    expect(styles).toContain("@media (max-width: 700px)");
  });

  it("owns the member profile controls and secure password handoff", () => {
    const workspace = read(
      "components/dashboard/client-settings-workspace.tsx",
    );
    const styles = read(
      "components/dashboard/client-settings-workspace.module.css",
    );

    expect(workspace).toContain("Make the plan fit you");
    expect(workspace).toContain("saveSettingsAction");
    expect(workspace).toContain("clientSettingsOptions");
    expect(workspace).toContain('href="/change-password"');
    expect(workspace).not.toContain("DashboardFormSection");
    expect(workspace).not.toContain("AccountSecurityPanel");
    expect(styles).toContain("var(--rl-red)");
    expect(styles).not.toContain("var(--mv-");
    expect(styles).toContain("@media (max-width: 700px)");
  });

  it("keeps temporary visual QA routes out of the product tree", () => {
    expect(() => read("app/redline-qa/clients/page.tsx")).toThrow();
    expect(() => read("app/redline-qa/schedule/page.tsx")).toThrow();
  });
});
