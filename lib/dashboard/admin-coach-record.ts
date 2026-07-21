import type { TrainingCategoryOption } from "@/lib/dashboard/training-category";

export type AdminCoachAssignedGroup = {
  id: string;
  name: string;
  categoryId: string;
  categoryName: string;
};

export type AdminCoachRecord = {
  id: string;
  fullName: string;
  qualifiedCategories: TrainingCategoryOption[];
  assignedGroups: AdminCoachAssignedGroup[];
  activeClients: number;
  activeGroups: number;
  sessionsToday: number;
  sessionsThisWeek: number;
  conflicts: number;
  weeklyLoad: Array<{ day: string; sessions: number }>;
  email: string;
  phone: string;
  summary: string;
};
