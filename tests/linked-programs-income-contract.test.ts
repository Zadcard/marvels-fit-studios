import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

const migration = read("supabase/migrations/20260726140000_link_clients_leads_and_studio_income.sql");
const rpcCompatibilityMigration = read("supabase/migrations/20260726150000_fix_admin_save_client_legacy_category_type.sql");
const clientPage = read("app/(dashboard)/admin/clients/page.tsx");
const leadsPage = read("app/(dashboard)/admin/join-requests/page.tsx");
const subscriptionsPage = read("app/(dashboard)/admin/subscriptions/page.tsx");
const clientActions = read("app/actions/admin-clients.ts");
const leadActions = read("app/actions/admin-leads.ts");
const paymentActions = read("app/actions/admin-payments.ts");
const todayWorkspace = read("components/dashboard/marvel-ops-today.tsx");
const programsWorkspace = read("components/dashboard/admin-training-categories-workspace.tsx");
const entityForm = read("components/ui/entity-form.tsx");

describe("linked programs and studio income contract", () => {
  it("backfills relational client and lead categories without inventing values", () => {
    expect(migration).toContain('set "categoryId" = studio_group."categoryId"');
    expect(migration).toContain('category."legacyValue" = client."trainingCategory"::text');
    expect(migration).toContain('category."legacyValue" = lead."interestedCategory"::text');
    expect(migration).toMatch(/Lead_categoryId_fkey[\s\S]*on delete restrict/);
    expect(migration).toMatch(/Client_categoryId_fkey[\s\S]*on delete restrict/);
  });

  it("keeps the client RPC compatibility field on the renamed legacy enum", () => {
    expect(rpcCompatibilityMigration).toContain('::public."LegacyTrainingCategory"');
    expect(rpcCompatibilityMigration).not.toContain("reset");
  });

  it("keeps client and lead group assignments inside the selected program", () => {
    expect(clientActions).toContain("group.categoryId !== categoryId");
    expect(leadActions).toContain("group.categoryId !== lead.categoryId");
    expect(migration).toContain("The group does not belong to the lead interested category.");
    expect(migration).toContain('new."categoryId" := group_category_id');
  });

  it("feeds user-facing selectors only active programs and active groups", () => {
    for (const source of [clientPage, leadsPage]) {
      expect(source).toContain("options({ activeOnly: true })");
      expect(source).toContain("group.isActive");
      expect(source).toContain("activeCategoryIds.has(group.categoryId)");
    }
    expect(subscriptionsPage).toContain("g.isActive && activeCategoryIds.has(g.categoryId)");
  });

  it("uses the shared entity dialog theme for program data entry", () => {
    expect(programsWorkspace).toContain("<EntityDialog");
    expect(programsWorkspace).toContain("<EntityForm");
    expect(programsWorkspace).toContain("New program");
    expect(entityForm).toContain("Dialog.Overlay");
    expect(entityForm).toContain("FormActions");
  });

  it("supports audited non-client income and removes cash out from Today", () => {
    expect(migration).toContain('create table public."StudioIncome"');
    expect(migration).toContain("create or replace function public.record_studio_income");
    expect(paymentActions).toContain('sourceType: "client" | "other"');
    expect(paymentActions).toContain('supabase.rpc("record_studio_income"');
    expect(todayWorkspace).not.toContain("AdminCashOutDialog");
    expect(todayWorkspace).not.toContain("Record cash out");
  });
});
