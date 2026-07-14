import "server-only";

import { requireCoachClientAccess } from "@/lib/auth/coach-client-access";
import type { ClientTransformationData } from "@/lib/dashboard/client-transformation";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export class ClientTransformationRepository {
  async getForCoach(
    coachUserId: string,
    clientId: string
  ): Promise<ClientTransformationData> {
    await requireCoachClientAccess(coachUserId, clientId);
    const supabase = getSupabaseServerClient();
    const [clientResult, exercisesResult] = await Promise.all([
      supabase
        .from("Client")
        .select(
          `
          id,fullName,phone,
          assessments:ClientAssessment(id,status,experienceLevel,primaryGoal,
            secondaryGoals,injuriesLimitations,medicalNotes,baselineSummary,
            consentAcknowledgedAt,assessedAt),
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
        .eq("id", clientId)
        .single(),
      supabase
        .from("Exercise")
        .select("id,name,category,instructions,defaultUnit")
        .eq("isActive", true)
        .order("name"),
    ]);

    if (clientResult.error) throw clientResult.error;
    if (exercisesResult.error) throw exercisesResult.error;

    const client = clientResult.data;
    const assessment = [...client.assessments]
      .sort((left, right) => right.assessedAt.localeCompare(left.assessedAt))[0];

    return {
      client: {
        id: client.id,
        fullName: client.fullName,
        phone: client.phone ?? "No phone",
      },
      assessment: assessment
        ? {
            id: assessment.id,
            status: assessment.status,
            experienceLevel: assessment.experienceLevel,
            primaryGoal: assessment.primaryGoal,
            secondaryGoals: assessment.secondaryGoals ?? "",
            injuriesLimitations: assessment.injuriesLimitations ?? "",
            medicalNotes: assessment.medicalNotes ?? "",
            baselineSummary: assessment.baselineSummary ?? "",
            consentAcknowledged: Boolean(assessment.consentAcknowledgedAt),
            assessedAt: assessment.assessedAt,
          }
        : null,
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
      exercises: exercisesResult.data.map((exercise) => ({
        ...exercise,
        instructions: exercise.instructions ?? "",
        defaultUnit: exercise.defaultUnit ?? "",
      })),
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

export const clientTransformationRepository =
  new ClientTransformationRepository();
