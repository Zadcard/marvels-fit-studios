import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");
const migration = read("supabase/migrations/20260726000000_training_categories_groups_coaches.sql");
const categoryActions = read("app/actions/admin-training-categories.ts");
const groupActions = read("app/actions/admin-groups.ts");
const coachActions = read("app/actions/admin-coaches.ts");

describe("training category database contract", () => {
  it("preserves the old enum before creating the first-class entity", () => {
    expect(migration.indexOf('rename to "LegacyTrainingCategory"')).toBeLessThan(
      migration.indexOf('create table public."TrainingCategory"'),
    );
    expect(migration).toContain('constraint "TrainingCategory_slug_key" unique ("slug")');
    expect(migration).toContain('unique index "TrainingCategory_name_lower_key"');
  });

  it("backfills only distinct category values already stored in reliable columns", () => {
    expect(migration).toContain('select distinct "trainingCategory"::text as legacy_value from public."Group"');
    expect(migration).toContain('select distinct "trainingCategory"::text from public."Client"');
    expect(migration).toContain('select distinct "interestedCategory"::text from public."Lead"');
    expect(migration).not.toMatch(/values\s*\(\s*'Burning Class'/i);
  });

  it("makes every group category required and prevents referenced deletion", () => {
    expect(migration).toContain('alter column "categoryId" set not null');
    expect(migration).toMatch(/foreign key \("categoryId"\) references public\."TrainingCategory"\("id"\)\s+on delete restrict/);
    expect(categoryActions).toContain('error?.code === "23503"');
    expect(categoryActions).toContain("Archive the category instead");
  });

  it("models coach qualifications independently from assigned groups", () => {
    expect(migration).toContain('create table public."CoachTrainingCategory"');
    expect(migration).toContain('primary key ("coachId", "categoryId")');
    expect(migration).toContain('select distinct "coachId", "categoryId"');
    expect(coachActions).toContain("qualifiedCategoryIds");
    expect(groupActions).toContain("categoryId");
  });

  it("enforces qualification when assigning a coach to a group", () => {
    expect(migration).toContain("The selected coach is not qualified for this category.");
    expect(migration).toContain("A qualification used by an assigned group cannot be removed.");
  });

  it("removes retired numeric limits from all active scheduling tables", () => {
    expect(migration).toContain('alter table public."Group" drop column "trainingCategory", drop column "capacity"');
    expect(migration).toContain('alter table public."TrainingSession" drop column "capacity"');
    expect(migration).toContain('alter table public."RecurringSessionTemplate" drop column "capacity"');
  });
});
