import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("category supervisor contract", () => {
  it("adds a protected many-to-many supervisor relationship without inventing assignments", () => {
    const migration = read("supabase/migrations/20260726120000_category_supervisors.sql");
    expect(migration).toContain('create table public."CategorySupervisor"');
    expect(migration).toContain('primary key ("categoryId", "coachId")');
    expect(migration).toContain('on delete restrict');
    expect(migration).toContain('on delete cascade');
    expect(migration).toContain("set_category_supervisors");
    expect(migration).toContain("sync_group_memberships");
    expect(migration).not.toContain('insert into public."CategorySupervisor" ("categoryId", "coachId")\nselect distinct');
  });

  it("authorizes category writes for admins or assigned coach supervisors", () => {
    const access = read("lib/auth/category-access.ts");
    expect(access).toContain("user.role === UserRole.ADMIN");
    expect(access).toContain('user.role !== UserRole.COACH');
    expect(access).toContain('.from("CategorySupervisor")');
    expect(access).toContain('.eq("categoryId", categoryId)');
    expect(access).toContain('.eq("coachId", coachId)');
  });

  it("keeps category lifecycle and supervisor assignment admin-only", () => {
    const actions = read("app/actions/admin-training-categories.ts");
    expect(actions).toContain("requireCategoryWriteAccess(parsed.data.categoryId)");
    expect(actions).toContain("setTrainingCategorySupervisors");
    expect(actions.match(/requireRole\(UserRole\.ADMIN\)/g)?.length).toBeGreaterThanOrEqual(4);
  });

  it("exposes only supervised categories to coaches and redirects the old groups route", () => {
    const coachPage = read("app/(dashboard)/coach/categories/page.tsx");
    expect(coachPage).toContain("getSupervisedCategoryIdsForUserId");
    expect(coachPage).toContain('mode="supervisor"');
    expect(read("app/(dashboard)/admin/groups/page.tsx")).toContain('redirect("/admin/categories")');
  });

  it("creates groups with clients and the existing recurring-series editor inside a category", () => {
    const groups = read("components/dashboard/admin-groups-workspace.tsx");
    expect(groups).toContain("embeddedCategoryId");
    expect(groups).toContain("clientIds: form.clientIds");
    expect(groups).toContain("<SeriesSlotsEditor");
    expect(read("app/actions/admin-groups.ts")).toContain('supabase.rpc("sync_group_memberships"');
  });
});
