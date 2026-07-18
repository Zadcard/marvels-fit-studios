import "server-only";

import {
  TrainingSessionStatus,
  TrainingSessionType,
} from "@/lib/supabase/domain";
import type {
  AdminScheduleSessionRecord,
  AdminScheduleSessionStatus,
  AdminScheduleStat,
} from "@/lib/dashboard/admin-schedule-data";
import type { AdminSessionCoachOption } from "@/lib/repositories/admin-session-repository";
import {
  injuryStatusHasAlert,
  trainingCategoryLabelFor,
} from "@/lib/dashboard/client-domain-labels";
import { withSupabaseFallback } from "@/lib/supabase/errors";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  addStudioDays,
  getStudioDateKey,
  getStudioDayRange,
  STUDIO_TIME_ZONE,
} from "@/lib/time/studio-time";

const dayLabelFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: STUDIO_TIME_ZONE,
  weekday: "long",
});
const dateLabelFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: STUDIO_TIME_ZONE,
  month: "short",
  day: "numeric",
});
const timeFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: STUDIO_TIME_ZONE,
  hour: "numeric",
  minute: "2-digit",
});

function mapScheduleStatus(input: {
  status: TrainingSessionStatus;
  bookingsCount: number;
  capacity: number | null;
}) {
  if (input.status === TrainingSessionStatus.COMPLETED) {
    return "Completed" as const;
  }

  if (
    input.capacity !== null &&
    input.capacity > 0 &&
    input.bookingsCount >= input.capacity
  ) {
    return "Waitlist" as const;
  }

  if (
    input.status === TrainingSessionStatus.DRAFT ||
    input.status === TrainingSessionStatus.CANCELED
  ) {
    return "Attention" as const;
  }

  return "Confirmed" as const;
}

function getTimeRange(startsAt: Date, endsAt: Date) {
  return `${timeFormatter.format(startsAt)} - ${timeFormatter.format(endsAt)}`;
}

function mapChangeTypeLabel(changeType: string) {
  switch (changeType) {
    case "RESCHEDULED":
      return "Rescheduled";
    case "CANCELED":
      return "Canceled";
    case "COACH_CHANGED":
      return "Coach changed";
    default:
      return "Updated";
  }
}

export type AdminScheduleGroupOption = {
  id: string;
  name: string;
};

export type AdminScheduleClientOption = {
  id: string;
  fullName: string;
};

export class AdminScheduleRepository {
  async getSchedule(input?: { weekStart?: string }): Promise<{
    stats: AdminScheduleStat[];
    records: AdminScheduleSessionRecord[];
    coachOptions: AdminSessionCoachOption[];
    groupOptions: AdminScheduleGroupOption[];
    clientOptions: AdminScheduleClientOption[];
  }> {
    return withSupabaseFallback(
      async () => {
        const supabase = getSupabaseServerClient();
        const weekStart = input?.weekStart ?? getStudioDateKey();
        const scheduleWindow = getStudioDayRange(weekStart);
        const scheduleWindowEnd = getStudioDayRange(addStudioDays(weekStart, 7));
        const sessionsPromise = supabase
          .from("TrainingSession")
          .select(
            `
          id, title, description, type, status, startsAt, endsAt, location,
          capacity, coachId, groupId, sourceTemplateId, isTemplateException,
          coach:Coach(fullName),
          group:Group(name, trainingCategory, clients:Client(id)),
          bookings:SessionBooking(id, status, client:Client(id, fullName, status, injuryStatus)),
          changes:ScheduleChangeLog(id, changeType, createdAt)
        `,
          )
          .gte("startsAt", scheduleWindow.start)
          .lt("startsAt", scheduleWindowEnd.start)
          .order("startsAt", { ascending: true });

        const [sessionsResult, coachesResult, groupsResult, clientsResult] = await Promise.all(
          [
            sessionsPromise,
            supabase.from("Coach").select("id, fullName").order("fullName"),
            supabase.from("Group").select("id, name").order("name"),
            supabase.from("Client").select("id, fullName").order("fullName"),
          ],
        );
        if (sessionsResult.error) throw sessionsResult.error;
        if (coachesResult.error) throw coachesResult.error;
        if (groupsResult.error) throw groupsResult.error;
        if (clientsResult.error) throw clientsResult.error;

        const sessions = sessionsResult.data;
        const coaches = coachesResult.data;
        const groups = groupsResult.data;
        const records = sessions.map((session) => {
          const startsAt = new Date(session.startsAt);
          const endsAt = new Date(session.endsAt);
          const activeBookings = session.bookings.filter((booking) =>
            ["BOOKED", "ATTENDED", "WAITLIST"].includes(booking.status),
          );
          const bookingsCount = activeBookings.length;
          const waitlistCount = activeBookings.filter(
            (booking) => booking.status === "WAITLIST",
          ).length;
          const injuryAlertCount = activeBookings.filter(
            (booking) =>
              booking.client &&
              injuryStatusHasAlert(booking.client.injuryStatus),
          ).length;
          const trialCount = activeBookings.filter(
            (booking) => booking.client?.status === "TRIAL",
          ).length;
          const scheduleStatus: AdminScheduleSessionStatus = mapScheduleStatus({
            status: session.status,
            bookingsCount,
            capacity: session.capacity,
          });

          return {
            id: session.id,
            title: session.title,
            rawStatus: session.status,
            sessionType:
              session.type === TrainingSessionType.PRIVATE
                ? ("Private" as const)
                : ("Group" as const),
            status: scheduleStatus,
            groupName: session.group?.name ?? "No linked group",
            dayKey: getStudioDateKey(startsAt),
            dayLabel: dayLabelFormatter.format(startsAt),
            dateLabel: dateLabelFormatter.format(startsAt),
            timeRange: getTimeRange(startsAt, endsAt),
            coachId: session.coachId,
            groupId: session.groupId,
            coachName: session.coach.fullName,
            trainingCategory: session.group?.trainingCategory
              ? trainingCategoryLabelFor(session.group.trainingCategory)
              : null,
            injuryAlertCount,
            trialCount,
            location: session.location ?? "Studio floor",
            occupancyLabel:
              session.type === TrainingSessionType.PRIVATE
                ? `${Math.min(bookingsCount, 1)} / 1 booked`
                : `${bookingsCount} / ${
                    session.capacity ?? Math.max(bookingsCount, 1)
                  } booked`,
            rosterCount: session.group?.clients.length ?? 0,
            bookedCount: bookingsCount,
            waitlistCount,
            attendanceNote:
              bookingsCount > 0
                ? `${bookingsCount} client${bookingsCount === 1 ? "" : "s"} booked so far.`
                : "No active bookings yet.",
            focus:
              session.description ??
              (session.type === TrainingSessionType.PRIVATE
                ? "Private coaching session."
                : "Group training session."),
            highlight:
              scheduleStatus === "Waitlist"
                ? "Session is at capacity"
                : scheduleStatus === "Attention"
                  ? "Needs review before it runs"
                  : "Manual session",
            startsAt: startsAt.toISOString(),
            endsAt: endsAt.toISOString(),
            capacity:
              session.type === TrainingSessionType.PRIVATE
                ? 1
                : session.capacity,
            sourceTemplateId: session.sourceTemplateId,
            isTemplateException: session.isTemplateException,
            bookedClients: activeBookings.flatMap((booking) =>
              booking.client
                ? [{
                    id: booking.client.id,
                    fullName: booking.client.fullName,
                    status: booking.status as "BOOKED" | "ATTENDED" | "MISSED" | "WAITLIST",
                  }]
                : [],
            ),
            recentChanges: [...session.changes]
              .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
              .slice(0, 3)
              .map((change) => ({
                id: change.id,
                label: mapChangeTypeLabel(change.changeType),
                dateLabel: dateLabelFormatter.format(new Date(change.createdAt)),
              })),
          } satisfies AdminScheduleSessionRecord;
        });

        const recordsThisWeek = records;
        const waitlistCount = recordsThisWeek.filter(
          (record) => record.status === "Waitlist",
        ).length;
        const privateCount = recordsThisWeek.filter(
          (record) => record.sessionType === "Private",
        ).length;
        const confirmedCount = recordsThisWeek.filter(
          (record) => record.status === "Confirmed",
        ).length;
        const stats: AdminScheduleStat[] = [
          {
            id: "weekly-slots",
            label: "This week",
            value: `${recordsThisWeek.length}`,
            change: `${privateCount} private ${privateCount === 1 ? "session" : "sessions"}`,
            detail: "Upcoming occurrences currently on the operational board.",
            note: "Occurrence layer",
            icon: "calendar-clock",
            tone: "accent",
          },
          {
            id: "coach-coverage",
            label: "Coach coverage",
            value: `${coaches.length}`,
            change: `${confirmedCount} confirmed ${confirmedCount === 1 ? "session" : "sessions"}`,
            detail: "Available coaches connected to the week view.",
            note: "Roster live",
            icon: "target",
            tone: "success",
          },
          {
            id: "attention",
            label: "Needs attention",
            value: `${recordsThisWeek.filter((record) => record.status === "Attention").length}`,
            change: `${waitlistCount} at capacity`,
            detail:
              "Draft, canceled, or overloaded sessions in the planning window.",
            note: "Operational watch",
            icon: "clock-3",
            tone: waitlistCount > 0 ? "warning" : "neutral",
          },
        ];

        return {
          stats,
          records,
          coachOptions: coaches,
          groupOptions: groups,
          clientOptions: clientsResult.data,
        };
      },
      {
        stats: [],
        records: [],
        coachOptions: [],
        groupOptions: [],
        clientOptions: [],
      },
    );
  }
}

export const adminScheduleRepository = new AdminScheduleRepository();
