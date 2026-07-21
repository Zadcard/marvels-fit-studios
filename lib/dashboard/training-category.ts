export type TrainingCategoryOption = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
};

export type TrainingCategoryRelation = {
  id: string;
  name: string;
};

export type AdminTrainingCategoryRecord = TrainingCategoryOption & {
  legacyValue: string | null;
  groups: Array<TrainingCategoryRelation & { isActive: boolean }>;
  coaches: TrainingCategoryRelation[];
};

export function slugifyTrainingCategory(name: string) {
  return name
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
