import "server-only";

import type {
  AdminAttendanceAttendee,
  AdminAttendanceSession,
  AttendanceLabel,
} from "@/lib/dashboard/admin-attendance-record";
import {
  injuryStatusHasAlert,
  injuryStatusLabelFor,
  trainingCategoryLabelFor,
} from "@/lib/dashboard/client-domain-labels";
import type { BookingStatus } from "@/lib/supabase/domain";
import { withSupabaseFallback } from "@/lib/supabase/errors";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const timeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
});

function toAttendanceLabel(status: BookingStatus): AttendanceLabel {
  switch (status) {
    case "ATTENDED":
      return "Attended";
    case "MISSED":
      return "Absent";
    case "NO_SHOW":
      return "No-show";
    case "RESCHEDULED":
      return "Rescheduled";
    case "CANCELED":
      return "Cancelled";
    case "WAITLIST":
      return "Waitlisted";
    default:
      return "Booked";
  }
}

export class AdminAttendanceRepository {
  async getToday(): Promise<AdminAttendanceSession[]> {
    return withSupabaseFallback<AdminAttendanceSession[]>(async () => {
      const now = new Date();
      const startOfDay = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
      );
      const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

      const { data, error } = await getSupabaseServerClient()
        .from("TrainingSession")
        .select(
          "id,title,type,status,startsAt,coach:Coach(fullName),group:Group(trainingCategory),bookings:SessionBooking(status,client:Client(id,fullName,status,injuryStatus,injuryNotes))",
        )
        .neq("status", "CANCELED")
        .gte("startsAt", startOfDay.toISOString())
        .lt("startsAt", endOfDay.toISOString())
        .order("startsAt", { ascending: true });
      if (error) throw error;

      return data.map((session) => {
        const attendees: AdminAttendanceAttendee[] = session.bookings
          .map((booking) => ({
            clientId: booking.client.id,
            fullName: booking.client.fullName,
            status: toAttendanceLabel(booking.status),
            isTrial: booking.client.status === "TRIAL",
            hasInjuryAlert: injuryStatusHasAlert(booking.client.injuryStatus),
            injuryStatus: injuryStatusLabelFor(booking.client.injuryStatus),
            injuryNotes: booking.client.injuryNotes?.trim() ?? "",
          }))
          .sort((left, right) => left.fullName.localeCompare(right.fullName));

        return {
          id: session.id,
          title: session.title,
          timeLabel: timeFormatter.format(new Date(session.startsAt)),
          coachName: session.coach?.fullName ?? "Unassigned",
          sessionType: session.type === "PRIVATE" ? "Private" : "Group",
          trainingCategory: session.group?.trainingCategory
            ? trainingCategoryLabelFor(session.group.trainingCategory)
            : null,
          attendees,
        };
      });
    }, []);
  }
}

export const adminAttendanceRepository = new AdminAttendanceRepository();
