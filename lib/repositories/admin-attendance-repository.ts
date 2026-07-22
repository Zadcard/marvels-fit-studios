import "server-only";

import type {
  AdminAttendanceAttendee,
  AdminAttendanceSession,
  AttendanceLabel,
} from "@/lib/dashboard/admin-attendance-record";
import {
  injuryStatusHasAlert,
  injuryStatusLabelFor,
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
  async getForDate(dateKey?: string): Promise<AdminAttendanceSession[]> {
    return withSupabaseFallback<AdminAttendanceSession[]>(async () => {
      const now = new Date();
      const dayAnchor = dateKey
        ? new Date(dateKey.includes("T") ? dateKey : `${dateKey}T00:00:00Z`)
        : now;
      const startOfDay = new Date(
        dayAnchor.getUTCFullYear(),
        dayAnchor.getUTCMonth(),
        dayAnchor.getUTCDate(),
      );
      const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

      const { data, error } = await getSupabaseServerClient()
        .from("TrainingSession")
        .select(
          "id,title,type,status,startsAt,coach:Coach(fullName),group:Group(category:TrainingCategory(name)),bookings:SessionBooking(status,client:Client(id,fullName,phone,status,injuryStatus,injuryNotes,user:User(email),group:Group(id,name,category:TrainingCategory(name))))",
        )
        .neq("status", "CANCELED")
        .gte("startsAt", startOfDay.toISOString())
        .lt("startsAt", endOfDay.toISOString())
        .order("startsAt", { ascending: true });
      if (error) throw error;

      return data.map((session) => {
        const attendees: AdminAttendanceAttendee[] = session.bookings
          .map((booking) => {
            const client = booking.client;
            return {
              clientId: client.id,
              fullName: client.fullName,
              email: client.user?.email ?? null,
              phone: client.phone ?? null,
              groupName: client.group?.name ?? session.group?.category?.name ?? null,
              categoryName: client.group?.category?.name ?? session.group?.category?.name ?? null,
              status: toAttendanceLabel(booking.status),
              isTrial: client.status === "TRIAL",
              hasInjuryAlert: injuryStatusHasAlert(client.injuryStatus, client.injuryNotes),
              injuryStatus: injuryStatusLabelFor(client.injuryStatus),
              injuryNotes: client.injuryNotes?.trim() ?? "",
            };
          })
          .sort((left, right) => left.fullName.localeCompare(right.fullName));

        return {
          id: session.id,
          title: session.title,
          timeLabel: timeFormatter.format(new Date(session.startsAt)),
          startsAt: session.startsAt,
          coachName: session.coach?.fullName ?? "Unassigned",
          sessionType: session.type === "PRIVATE" ? "Private" : "Group",
          trainingCategory: session.group?.category?.name ?? null,
          attendees,
        };
      });
    }, []);
  }

  async getToday(): Promise<AdminAttendanceSession[]> {
    return this.getForDate();
  }
}

export const adminAttendanceRepository = new AdminAttendanceRepository();
