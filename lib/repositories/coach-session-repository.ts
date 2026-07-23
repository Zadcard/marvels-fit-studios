import "server-only";

import type {
  CoachSessionBookingRecord,
  CoachSessionRecord,
  CoachSessionStatus,
} from "@/lib/dashboard/coach-session-data";
import type { CoachScheduleRecord } from "@/lib/dashboard/coach-schedule-data";
import {
  injuryStatusHasAlert,
  injuryStatusLabelFor,
} from "@/lib/dashboard/client-domain-labels";
import type { BookingStatus } from "@/lib/supabase/domain";
import { withSupabaseFallback } from "@/lib/supabase/errors";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const dayFormatter = new Intl.DateTimeFormat("en-US", { weekday: "short" });
const dayKeyFormatter = new Intl.DateTimeFormat("en-US", { weekday: "long" });
const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});
const timeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
});

function getDayLabel(date: Date) {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);

  if (date.toDateString() === now.toDateString()) {
    return "Today";
  }

  if (date.toDateString() === tomorrow.toDateString()) {
    return "Tomorrow";
  }

  return dayFormatter.format(date);
}

function mapSessionStatus(input: {
  startsAt: Date;
  status: "DRAFT" | "SCHEDULED" | "COMPLETED" | "CANCELED";
  bookings: Array<{ status: BookingStatus }>;
}): CoachSessionStatus {
  if (input.status === "COMPLETED") {
    return "Completed";
  }

  if (input.bookings.some((booking) => booking.status === "WAITLIST")) {
    return "Waitlist";
  }

  if (input.startsAt.getTime() <= Date.now() + 60 * 60 * 1000) {
    return "Ready";
  }

  return "Prep";
}

function mapBookingStatus(
  status: BookingStatus
): CoachSessionBookingRecord["status"] | null {
  switch (status) {
    case "ATTENDED":
      return "Attended";
    case "MISSED":
      return "Missed";
    case "WAITLIST":
      return "Waitlist";
    case "BOOKED":
      return "Booked";
    default:
      return null;
  }
}

export class CoachSessionRepository {
  async listClientOptions(): Promise<Array<{ id: string; fullName: string }>> {
    return withSupabaseFallback(
      async () => {
        const { data, error } = await getSupabaseServerClient()
          .from("Client").select("id,fullName").order("fullName");
        if (error) throw error;
        return data;
      },
      []
    );
  }

  async listForCoachUserId(userId: string): Promise<CoachSessionRecord[]> {
    return withSupabaseFallback(async () => {
      const { data, error } = await getSupabaseServerClient()
        .from("TrainingSession")
        .select("id,title,description,type,status,startsAt,endsAt,coach:Coach!inner(userId),notes:SessionNote(content,createdAt),bookings:SessionBooking(status,bookedAt,client:Client(id,fullName,injuryStatus,injuryNotes,restrictions))")
        .eq("coach.userId", userId).neq("status", "CANCELED").order("startsAt");
      if (error) throw error;
      const now = new Date();
      const sessions = data.map((session) => ({
        ...session,
        startsAt: new Date(session.startsAt),
        endsAt: new Date(session.endsAt),
        notes: session.notes.sort((a,b) => b.createdAt.localeCompare(a.createdAt)).slice(0,1),
        bookings: session.bookings
          .filter((booking) => ["BOOKED","ATTENDED","MISSED","WAITLIST"].includes(booking.status))
          .sort((a,b) => a.bookedAt.localeCompare(b.bookedAt)),
      }));

      return sessions.map((session) => {
      const bookings = session.bookings
        .map((booking) => {
          const status = mapBookingStatus(booking.status);

          if (!status) {
            return null;
          }

          return {
            clientId: booking.client.id,
            fullName: booking.client.fullName,
            status,
            injuryStatus: injuryStatusLabelFor(booking.client.injuryStatus),
            injuryNotes: booking.client.injuryNotes?.trim() ?? "",
            restrictions: booking.client.restrictions?.trim() ?? "",
            hasInjuryAlert: injuryStatusHasAlert(booking.client.injuryStatus, booking.client.injuryNotes),
          };
        })
        .filter((booking): booking is CoachSessionBookingRecord => booking !== null);

      const rosterLabel =
        session.type === "PRIVATE"
          ? bookings[0]?.fullName ?? "No client assigned"
          : `${bookings.length} booked`;

      const noteValue = session.notes[0]?.content ?? "";
      const minutes = Math.max(0, Math.round((session.endsAt.getTime() - session.startsAt.getTime()) / 60_000));
      const bookedCount = bookings.filter((booking) => booking.status !== "Missed").length;

      return {
        id: session.id,
        title: session.title,
        sessionType: session.type === "PRIVATE" ? "Private" : "Group",
        status: mapSessionStatus({
          startsAt: session.startsAt,
          status: session.status,
          bookings: session.bookings,
        }),
        dayLabel: getDayLabel(session.startsAt),
        timeLabel: timeFormatter.format(session.startsAt),
        durationLabel: `${minutes || 60} min`,
        isLive:
          session.startsAt.getTime() <= now.getTime() &&
          session.endsAt.getTime() > now.getTime() &&
          session.status !== "COMPLETED",
        rosterLabel,
        bookedCount,
        focus:
          session.description ??
          (session.type === "PRIVATE"
            ? "Private coaching session"
            : "Coached group session"),
        note: noteValue || "Attendance updates and coaching notes appear here.",
        noteValue,
        bookings,
      };
      });
    }, []);
  }

  async listScheduleForCoachUserId(userId: string): Promise<CoachScheduleRecord[]> {
    return withSupabaseFallback(async () => {
      const sessions = await this.listForCoachUserId(userId);

      return sessions.map((session) => {
        const timeRange = session.timeLabel;

        return {
          id: session.id,
          dayKey: dayKeyFormatter.format(
            this.parseSessionDate(session.dayLabel, session.timeLabel)
          ),
          dayLabel: session.dayLabel,
          dateLabel: dateFormatter.format(
            this.parseSessionDate(session.dayLabel, session.timeLabel)
          ),
          title: session.title,
          timeRange,
          sessionType: session.sessionType,
          status: session.status,
          rosterLabel: session.rosterLabel,
          note: session.note,
        };
      });
    }, []);
  }

  private parseSessionDate(dayLabel: string, timeLabel: string) {
    const now = new Date();
    const candidate = new Date(now);

    if (dayLabel === "Tomorrow") {
      candidate.setDate(candidate.getDate() + 1);
    } else if (dayLabel !== "Today") {
      const weekdays = [
        "Sun",
        "Mon",
        "Tue",
        "Wed",
        "Thu",
        "Fri",
        "Sat",
      ];
      const targetDay = weekdays.indexOf(dayLabel);

      if (targetDay >= 0) {
        const offset = (targetDay - candidate.getDay() + 7) % 7;
        candidate.setDate(candidate.getDate() + offset);
      }
    }

    const parsedTime = new Date(`2000-01-01 ${timeLabel}`);
    if (!Number.isNaN(parsedTime.getTime())) {
      candidate.setHours(parsedTime.getHours(), parsedTime.getMinutes(), 0, 0);
    }

    return candidate;
  }
}

export const coachSessionRepository = new CoachSessionRepository();
