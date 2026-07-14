export type TransformationAssessment = {
  id: string;
  status: "DRAFT" | "COMPLETE";
  experienceLevel: string;
  primaryGoal: string;
  secondaryGoals: string;
  injuriesLimitations: string;
  medicalNotes: string;
  baselineSummary: string;
  consentAcknowledged: boolean;
  assessedAt: string;
};

export type TransformationGoal = {
  id: string;
  title: string;
  description: string;
  metricType: string;
  baselineValue: number | null;
  targetValue: number | null;
  currentValue: number | null;
  unit: string;
  targetDate: string;
  status: "ACTIVE" | "ACHIEVED" | "PAUSED" | "CANCELED";
};

export type TransformationExercise = {
  id: string;
  name: string;
  category: string;
  instructions: string;
  defaultUnit: string;
};

export type TransformationPrescription = {
  id: string;
  orderIndex: number;
  sets: number;
  reps: string;
  targetLoad: number | null;
  loadUnit: string;
  tempo: string;
  restSeconds: number | null;
  notes: string;
  exercise: TransformationExercise;
};

export type TransformationWorkout = {
  id: string;
  title: string;
  dayOrder: number;
  notes: string;
  exercises: TransformationPrescription[];
};

export type TransformationProgram = {
  id: string;
  name: string;
  goalSummary: string;
  status: "DRAFT" | "ACTIVE" | "COMPLETED" | "ARCHIVED";
  startsAt: string;
  endsAt: string;
  workouts: TransformationWorkout[];
};

export type TransformationMetric = {
  id: string;
  metricType: string;
  value: number;
  unit: string;
  measuredAt: string;
  note: string;
};

export type TransformationCheckIn = {
  id: string;
  sleepQuality: number;
  energyLevel: number;
  sorenessLevel: number;
  stressLevel: number;
  painPresent: boolean;
  painDetails: string;
  memberNote: string;
  coachResponse: string;
  submittedAt: string;
};

export type TransformationWorkoutLog = {
  id: string;
  performedAt: string;
  durationMinutes: number | null;
  sessionRpe: number | null;
  notes: string;
  workoutTitle: string;
  sets: Array<{
    id: string;
    setNumber: number;
    reps: number | null;
    load: number | null;
    loadUnit: string;
    rpe: number | null;
    exerciseName: string;
  }>;
};

export type ClientTransformationData = {
  client: {
    id: string;
    fullName: string;
    phone: string;
  };
  assessment: TransformationAssessment | null;
  goals: TransformationGoal[];
  programs: TransformationProgram[];
  exercises: TransformationExercise[];
  metrics: TransformationMetric[];
  checkIns: TransformationCheckIn[];
  workoutLogs: TransformationWorkoutLog[];
};
