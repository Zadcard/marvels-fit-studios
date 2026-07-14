import type {
  TransformationCheckIn,
  TransformationGoal,
  TransformationMetric,
  TransformationProgram,
  TransformationWorkoutLog,
} from "@/lib/dashboard/client-transformation";

export type ClientProgressData = {
  client: {
    id: string;
    fullName: string;
  };
  primaryGoal: string;
  baselineSummary: string;
  goals: TransformationGoal[];
  programs: TransformationProgram[];
  metrics: TransformationMetric[];
  checkIns: TransformationCheckIn[];
  workoutLogs: TransformationWorkoutLog[];
};
