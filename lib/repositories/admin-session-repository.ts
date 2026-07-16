import "server-only";

import type {
  AdminGroupSessionRecord,
  AdminPrivateSessionRecord,
  AdminSessionStatus,
} from "@/lib/mocks/admin-sessions";
import type { BookingStatus } from "@/lib/supabase/domain";
import { withSupabaseFallback } from "@/lib/supabase/errors";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const dayFormatter = new Intl.DateTimeFormat("en-US", { weekday: "short" });
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

function mapStatus(
  status: "DRAFT" | "SCHEDULED" | "COMPLETED" | "CANCELED",
  isAtCapacity: boolean,
): AdminSessionStatus {
  if (status === "CANCELED") {
    return "Canceled";
  }

  if (status === "DRAFT") {
    return "Draft";
  }

  if (status === "COMPLETED") {
    return "Completed";
  }

  if (isAtCapacity) {
    return "Waitlist";
  }

  return "Scheduled";
}

function mapBookedClientStatus(
  status: BookingStatus,
): AdminSessionEditorRecord["bookedClients"][number]["status"] | null {
  switch (status) {
    case "BOOKED":
    case "ATTENDED":
    case "MISSED":
    case "WAITLIST":
      return status;
    default:
      return null;
  }
}

export type AdminSessionEditorRecord = {
  id: string;
  title: string;
  description: string;
  type: "GROUP" | "PRIVATE";
  status: "DRAFT" | "SCHEDULED" | "COMPLETED" | "CANCELED";
  coachId: string;
  groupId: string | null;
  groupName: string;
  location: string;
  startsAt: string;
  endsAt: string;
  capacity: number | null;
  bookedClients: Array<{
    id: string;
    fullName: string;
    status: "BOOKED" | "ATTENDED" | "MISSED" | "WAITLIST";
  }>;
};

export type AdminSessionCoachOption = {
  id: string;
  fullName: string;
};

export type AdminSessionClientOption = {
  id: string;
  fullName: string;
};

export class AdminSessionRepository {
  async list(): Promise<{
    groupRecords: AdminGroupSessionRecord[];
    privateRecords: AdminPrivateSessionRecord[];
    editorRecords: AdminSessionEditorRecord[];
    coachOptions: AdminSessionCoachOption[];
    clientOptions: AdminSessionClientOption[];
  }> {
    return withSupabaseFallback(
      async () => {
        const supabase = getSupabaseServerClient();
        const sessionsPromise = supabase
          .from("TrainingSession")
          .select(
            `
          id, title, description, startsAt, endsAt, location, status, type,
          capacity, coachId, groupId,
          coach:Coach(fullName),
          group:Group(name),
          bookings:SessionBooking(status, bookedAt, client:Client(id, fullName)),
          notes:SessionNote(content, createdAt)
        `,
          )
          .order("startsAt", { ascending: true });

        const [sessionsResult, coachesResult, clientsResult] =
          await Promise.all([
            sessionsPromise,
            supabase.from("Coach").select("id, fullName").order("fullName"),
            supabase.from("Client").select("id, fullName").order("fullName"),
          ]);
        if (sessionsResult.error) throw sessionsResult.error;
        if (coachesResult.error) throw coachesResult.error;
        if (clientsResult.error) throw clientsResult.error;

        const sessions = sessionsResult.data;
        const coaches = coachesResult.data;
        const clients = clientsResult.data;
        const groupRecords: AdminGroupSessionRecord[] = [];
        const privateRecords: AdminPrivateSessionRecord[] = [];
        const editorRecords: AdminSessionEditorRecord[] = [];

        for (const session of sessions) {
          const startsAt = new Date(session.startsAt);
          const bookedClients = session.bookings
            .filter((booking) => booking.status !== "CANCELED")
            .sort((left, right) => left.bookedAt.localeCompare(right.bookedAt))
            .map((booking) => {
              const status = mapBookedClientStatus(booking.status);

              if (!status) {
                return null;
              }

              return {
                id: booking.client.id,
                fullName: booking.client.fullName,
                status,
              };
            })
            .filter(
              (
                booking,
              ): booking is AdminSessionEditorRecord["bookedClients"][number] =>
                booking !== null,
            );
          const enrolled = bookedClients.length;
          const isAtCapacity =
            session.capacity !== null &&
            session.capacity > 0 &&
            enrolled >= session.capacity;
          const baseRecord = {
            id: session.id,
            title: session.title,
            coachName: session.coach.fullName,
            dayLabel: getDayLabel(startsAt),
            timeLabel: timeFormatter.format(startsAt),
            location: session.location ?? "Studio floor",
            status: mapStatus(session.status, isAtCapacity),
          };

          editorRecords.push({
            id: session.id,
            title: session.title,
            description: session.description ?? "",
            type: session.type,
            status: session.status,
            coachId: session.coachId,
            groupId: session.groupId,
            groupName: session.group?.name ?? "No linked group",
            location: session.location ?? "",
            startsAt: session.startsAt,
            endsAt: session.endsAt,
            capacity: session.capacity,
            bookedClients,
          });

          if (session.type === "PRIVATE") {
            const latestNote = session.notes.sort((left, right) =>
              right.createdAt.localeCompare(left.createdAt),
            )[0];
            privateRecords.push({
              ...baseRecord,
              clientName: bookedClients[0]?.fullName ?? "Unassigned",
              focus: latestNote?.content ?? "Private coaching session",
            });
          } else {
            groupRecords.push({
              ...baseRecord,
              capacity: session.capacity ?? Math.max(enrolled, 1),
              enrolled,
            });
          }
        }

        return {
          groupRecords,
          privateRecords,
          editorRecords,
          coachOptions: coaches,
          clientOptions: clients,
        };
      },
      {
        groupRecords: [],
        privateRecords: [],
        editorRecords: [],
        coachOptions: [],
        clientOptions: [],
      },
    );
  }
}

export const adminSessionRepository = new AdminSessionRepository();
