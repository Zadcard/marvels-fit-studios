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
import { getStudioDateKey, getStudioDayRange } from "@/lib/time/studio-time";


const timeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
});

type GroupClient = {
  id: string;
  fullName: string;
  phone: string | null;
  status: string;
  injuryStatus: "NONE" | "CURRENT" | "PREVIOUS" | "REHAB";
  injuryNotes: string | null;
  groupId: string | null;
  user: { email: string | null } | null;
  group: {
    id: string;
    name: string;
    category: { name: string } | null;
  } | null;
};

type TrialLead = {
  id: string;
  fullName: string;
  phone: string | null;
  trialGroupId: string | null;
  status: string;
};

function toAttendanceLabel(status: BookingStatus): AttendanceLabel {
  switch (status) {
    case "ATTENDED":
      return "Attended";
    case "LATE":
      return "Late";
    case "MISSED":
      return "Absent";
    case "EXCUSED":
      return "Excused";
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
      const targetKey = dateKey ? dateKey.slice(0, 10) : getStudioDateKey(now);
      const { start, endExclusive } = getStudioDayRange(targetKey);

      const supabase = getSupabaseServerClient();
      const { data, error } = await supabase
        .from("TrainingSession")
        .select(
          "id,title,type,status,startsAt,groupId,coach:Coach(fullName),group:Group(id,name,category:TrainingCategory(name)),bookings:SessionBooking(status,client:Client(id,fullName,phone,status,injuryStatus,injuryNotes,user:User(email),group:Group(id,name,category:TrainingCategory(name))))",
        )
        .neq("status", "CANCELED")
        .gte("startsAt", start)
        .lt("startsAt", endExclusive)
        .order("startsAt", { ascending: true });
      if (error) throw error;

      const groupIds = Array.from(new Set(data.map((s) => s.groupId).filter((id): id is string => Boolean(id))));
      const clientsByGroup: Record<string, GroupClient[]> = {};
      const leadsByGroup: Record<string, TrialLead[]> = {};

      if (groupIds.length > 0) {
        const [{ data: clientData }, { data: leadData }] = await Promise.all([
          supabase
            .from("Client")
            .select("id,fullName,phone,status,injuryStatus,injuryNotes,groupId,user:User(email),group:Group(id,name,category:TrainingCategory(name))")
            .in("groupId", groupIds),
          supabase
            .from("Lead")
            .select("id,fullName,phone,trialGroupId,status")
            .in("trialGroupId", groupIds)
            .in("status", ["CONTACTED", "TRIAL_DONE"]),
        ]);

        (clientData || []).forEach((client) => {
          if (client.groupId) {
            clientsByGroup[client.groupId] = clientsByGroup[client.groupId] || [];
            clientsByGroup[client.groupId].push(client);
          }
        });

        (leadData || []).forEach((lead) => {
          if (lead.trialGroupId) {
            leadsByGroup[lead.trialGroupId] = leadsByGroup[lead.trialGroupId] || [];
            leadsByGroup[lead.trialGroupId].push(lead);
          }
        });
      }

      return data.map((session) => {
        const sessionGroup = session.group;
        const attendees: AdminAttendanceAttendee[] = session.bookings
          .map((booking) => {
            const client = booking.client;
            return {
              clientId: client.id,
              fullName: client.fullName,
              email: client.user?.email ?? null,
              phone: client.phone ?? null,
              groupName: client.group?.name ?? sessionGroup?.name ?? sessionGroup?.category?.name ?? null,
              categoryName: client.group?.category?.name ?? sessionGroup?.category?.name ?? null,
              status: toAttendanceLabel(booking.status),
              isTrial: client.status === "TRIAL",
              hasInjuryAlert: injuryStatusHasAlert(client.injuryStatus, client.injuryNotes),
              injuryStatus: injuryStatusLabelFor(client.injuryStatus),
              injuryNotes: client.injuryNotes?.trim() ?? "",
            };
          });

        const bookedClientIds = new Set(attendees.map((a) => a.clientId));

        if (session.groupId && clientsByGroup[session.groupId]) {
          clientsByGroup[session.groupId].forEach((client) => {
            if (!bookedClientIds.has(client.id)) {
              attendees.push({
                clientId: client.id,
                fullName: client.fullName,
                email: client.user?.email ?? null,
                phone: client.phone ?? null,
                groupName: client.group?.name ?? sessionGroup?.name ?? null,
                categoryName: client.group?.category?.name ?? sessionGroup?.category?.name ?? null,
                status: "Booked",
                isTrial: client.status === "TRIAL",
                hasInjuryAlert: injuryStatusHasAlert(client.injuryStatus, client.injuryNotes),
                injuryStatus: injuryStatusLabelFor(client.injuryStatus),
                injuryNotes: client.injuryNotes?.trim() ?? "",
              });
              bookedClientIds.add(client.id);
            }
          });
        }

        if (session.groupId && leadsByGroup[session.groupId]) {
          leadsByGroup[session.groupId].forEach((lead) => {
            if (!bookedClientIds.has(lead.id)) {
              attendees.push({
                clientId: lead.id,
                fullName: lead.fullName,
                email: null,
                phone: lead.phone ?? null,
                groupName: sessionGroup?.name ?? null,
                categoryName: sessionGroup?.category?.name ?? null,
                status: "Booked",
                isTrial: true,
                hasInjuryAlert: false,
                injuryStatus: "None",
                injuryNotes: "",
              });
              bookedClientIds.add(lead.id);
            }
          });
        }

        attendees.sort((left, right) => left.fullName.localeCompare(right.fullName));


        return {
          id: session.id,
          title: session.title,
          timeLabel: timeFormatter.format(new Date(session.startsAt)),
          startsAt: session.startsAt,
          coachName: session.coach?.fullName ?? "Unassigned",
          sessionType: session.type === "PRIVATE" ? "Private" : "Group",
          trainingCategory: sessionGroup?.category?.name ?? null,
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
