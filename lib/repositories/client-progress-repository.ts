import "server-only";

import type { ClientProgressData } from "@/lib/dashboard/client-progress";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export class ClientProgressRepository {
  async getForClientUser(userId: string): Promise<ClientProgressData | null> {
    const { data: client, error } = await getSupabaseServerClient()
      .from("Client")
      .select(
        `
        id,fullName,
        assessments:ClientAssessment(status,primaryGoal,baselineSummary,assessedAt),
        goals:ClientGoal(id,title,description,metricType,baselineValue,targetValue,
          currentValue,unit,targetDate,status,createdAt),
        programs:TrainingProgram(id,name,goalSummary,status,startsAt,endsAt,createdAt,
          workouts:ProgramWorkout(id,title,dayOrder,notes,
            exercises:WorkoutExercise(id,orderIndex,sets,reps,targetLoad,loadUnit,
              tempo,restSeconds,notes,
              exercise:Exercise(id,name,category,instructions,defaultUnit)))),
        metrics:ProgressMetric(id,metricType,value,unit,measuredAt,note),
        checkIns:ClientCheckIn(id,sleepQuality,energyLevel,sorenessLevel,stressLevel,
          painPresent,painDetails,memberNote,coachResponse,submittedAt),
        workoutLogs:WorkoutLog(id,performedAt,durationMinutes,sessionRpe,notes,
          workout:ProgramWorkout(title),
          sets:WorkoutSetLog(id,setNumber,reps,load,loadUnit,rpe,
            exercise:Exercise(name)))
      `
      )
      .eq("userId", userId)
      .maybeSingle();

    if (error) throw error;
    if (!client) return null;

    const assessment = [...client.assessments]
      .filter((item) => item.status === "COMPLETE")
      .sort((left, right) => right.assessedAt.localeCompare(left.assessedAt))[0];

    return {
      client: { id: client.id, fullName: client.fullName },
      primaryGoal: assessment?.primaryGoal ?? "Your primary goal will appear after assessment.",
      baselineSummary: assessment?.baselineSummary ?? "No baseline summary yet.",
      goals: [...client.goals]
        .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
        .map(({ createdAt, ...goal }) => {
          void createdAt;
          return {
            ...goal,
            description: goal.description ?? "",
            metricType: goal.metricType ?? "",
            unit: goal.unit ?? "",
            targetDate: goal.targetDate ?? "",
          };
        }),
      programs: [...client.programs]
        .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
        .map(({ createdAt, ...program }) => {
          void createdAt;
          return {
            ...program,
            goalSummary: program.goalSummary ?? "",
            endsAt: program.endsAt ?? "",
            workouts: [...program.workouts]
              .sort((left, right) => left.dayOrder - right.dayOrder)
              .map((workout) => ({
                ...workout,
                notes: workout.notes ?? "",
                exercises: [...workout.exercises]
                  .sort((left, right) => left.orderIndex - right.orderIndex)
                  .map((prescription) => ({
                    ...prescription,
                    loadUnit: prescription.loadUnit ?? "",
                    tempo: prescription.tempo ?? "",
                    notes: prescription.notes ?? "",
                    exercise: {
                      ...prescription.exercise,
                      instructions: prescription.exercise.instructions ?? "",
                      defaultUnit: prescription.exercise.defaultUnit ?? "",
                    },
                  })),
              })),
          };
        }),
      metrics: [...client.metrics]
        .sort((left, right) => right.measuredAt.localeCompare(left.measuredAt))
        .map((metric) => ({ ...metric, note: metric.note ?? "" })),
      checkIns: [...client.checkIns]
        .sort((left, right) => right.submittedAt.localeCompare(left.submittedAt))
        .map((checkIn) => ({
          ...checkIn,
          painDetails: checkIn.painDetails ?? "",
          memberNote: checkIn.memberNote ?? "",
          coachResponse: checkIn.coachResponse ?? "",
        })),
      workoutLogs: [...client.workoutLogs]
        .sort((left, right) => right.performedAt.localeCompare(left.performedAt))
        .map((log) => ({
          id: log.id,
          performedAt: log.performedAt,
          durationMinutes: log.durationMinutes,
          sessionRpe: log.sessionRpe,
          notes: log.notes ?? "",
          workoutTitle: log.workout?.title ?? "Workout",
          sets: log.sets.map((set) => ({
            id: set.id,
            setNumber: set.setNumber,
            reps: set.reps,
            load: set.load,
            loadUnit: set.loadUnit ?? "",
            rpe: set.rpe,
            exerciseName: set.exercise.name,
          })),
        })),
    };
  }
}

export const clientProgressRepository = new ClientProgressRepository();
