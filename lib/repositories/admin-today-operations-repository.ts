import "server-only";

import type {
  AdminTodayCoach,
  AdminTodayOperations,
} from "@/lib/dashboard/admin-today-operations";
import { withSupabaseFallback } from "@/lib/supabase/errors";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getInitials } from "@/lib/utils";

const timeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
  timeZone: "Africa/Cairo",
});

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "EGP",
  maximumFractionDigits: 0,
});

function getDayBounds(now: Date) {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

function dueLabel(value: Date, now: Date) {
  const days = Math.max(0, Math.ceil((value.getTime() - now.getTime()) / 86_400_000));
  if (days === 0) return "today";
  if (days === 1) return "in 1 day";
  return `in ${days} days`;
}

export class AdminTodayOperationsRepository {
  async getToday(): Promise<AdminTodayOperations> {
    const supabase = getSupabaseServerClient();
    const now = new Date();
    const { start, end } = getDayBounds(now);
    const inSevenDays = new Date(now.getTime() + 7 * 86_400_000);

    const [sessions, trials, renewals, payments] = await Promise.all([
      withSupabaseFallback(async () => {
        const { data, error } = await supabase
          .from("TrainingSession")
          .select(
            "id,title,startsAt,endsAt,type,status,location,capacity,coach:Coach(id,fullName,specialization),bookings:SessionBooking(id,status)",
          )
          .neq("status", "CANCELED")
          .gte("startsAt", start.toISOString())
          .lt("startsAt", end.toISOString())
          .order("startsAt");
        if (error) throw error;
        return data;
      }, []),
      withSupabaseFallback(async () => {
        const { data, error } = await supabase
          .from("Client")
          .select("id,fullName,phone,trainingCategory,createdAt")
          .eq("status", "TRIAL")
          .order("createdAt", { ascending: false })
          .limit(4);
        if (error) throw error;
        return data;
      }, []),
      withSupabaseFallback(async () => {
        const { data, error } = await supabase
          .from("ClientSubscription")
          .select(
            "id,renewsAt,customPrice,status,client:Client(fullName),plan:SubscriptionPlan(name,price,currency)",
          )
          .in("status", ["ACTIVE", "TRIAL"])
          .gte("renewsAt", now.toISOString())
          .lte("renewsAt", inSevenDays.toISOString())
          .order("renewsAt")
          .limit(4);
        if (error) throw error;
        return data;
      }, []),
      withSupabaseFallback(async () => {
        const { data, error } = await supabase
          .from("Payment")
          .select("id,amount,currency,date,note,client:Client(fullName)")
          .gte("date", start.toISOString())
          .lt("date", end.toISOString())
          .order("date", { ascending: false });
        if (error) throw error;
        return data;
      }, []),
    ]);

    const mappedSessions = sessions.map((session) => {
      const startsAt = new Date(session.startsAt);
      const endsAt = new Date(session.endsAt);
      const bookedCount = session.bookings.filter((booking) =>
        ["BOOKED", "ATTENDED", "WAITLIST"].includes(booking.status),
      ).length;
      const minutes = Math.max(0, Math.round((endsAt.getTime() - startsAt.getTime()) / 60_000));
      return {
        id: session.id,
        title: session.title,
        timeLabel: timeFormatter.format(startsAt),
        durationLabel: `${minutes || 60} min`,
        sessionType: session.type === "PRIVATE" ? ("Private" as const) : ("Group" as const),
        coachName: session.coach.fullName,
        coachInitials: getInitials(session.coach.fullName),
        location: session.location ?? "Studio floor",
        bookedCount,
        capacity: session.capacity ?? Math.max(bookedCount, 1),
        isLive:
          startsAt.getTime() <= now.getTime() &&
          endsAt.getTime() > now.getTime() &&
          session.status !== "COMPLETED",
        startsAt,
        endsAt,
        coach: session.coach,
      };
    });

    const coachesById = new Map<string, AdminTodayCoach>();
    for (const session of mappedSessions) {
      const status = session.isLive
        ? "On floor"
        : session.startsAt > now
          ? "Later"
          : "Done";
      const current = coachesById.get(session.coach.id);
      if (current?.status === "On floor") continue;
      coachesById.set(session.coach.id, {
        id: session.coach.id,
        fullName: session.coach.fullName,
        initials: getInitials(session.coach.fullName),
        specialization: session.coach.specialization.replaceAll("_", " ").toLowerCase(),
        status,
        detail: session.isLive
          ? `${session.title} · until ${timeFormatter.format(session.endsAt)}`
          : session.startsAt > now
            ? `${session.title} at ${session.timeLabel}`
            : `Finished ${session.title}`,
      });
    }

    const totalCash = payments.reduce((sum, payment) => sum + payment.amount, 0);

    return {
      sessions: mappedSessions.map(({ startsAt, endsAt, coach, ...session }) => {
        void startsAt;
        void endsAt;
        void coach;
        return session;
      }),
      coaches: [...coachesById.values()].sort((left, right) => {
        const rank = { "On floor": 0, Later: 1, Done: 2 } as const;
        return rank[left.status] - rank[right.status];
      }),
      trials: trials.map((trial) => ({
        id: trial.id,
        fullName: trial.fullName,
        initials: getInitials(trial.fullName),
        trainingCategory: trial.trainingCategory.replaceAll("_", " ").toLowerCase(),
        phone: trial.phone ?? "No phone recorded",
      })),
      renewals: renewals.map((renewal) => {
        const renewalDate = new Date(renewal.renewsAt!);
        const amount = renewal.customPrice ?? renewal.plan.price;
        return {
          id: renewal.id,
          fullName: renewal.client.fullName,
          initials: getInitials(renewal.client.fullName),
          planName: renewal.plan.name,
          amountLabel: new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: renewal.plan.currency,
            maximumFractionDigits: 0,
          }).format(amount),
          dueLabel: dueLabel(renewalDate, now),
        };
      }),
      recentPayments: payments.slice(0, 5).map((payment) => ({
        id: payment.id,
        description: payment.note?.trim() || `${payment.client.fullName} payment`,
        amountLabel: new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: payment.currency,
          maximumFractionDigits: 0,
        }).format(payment.amount),
        timeLabel: timeFormatter.format(new Date(payment.date)),
      })),
      liveCount: mappedSessions.filter((session) => session.isLive).length,
      expectedClients: mappedSessions.reduce((sum, session) => sum + session.bookedCount, 0),
      cashTodayLabel: currencyFormatter.format(totalCash),
      cashTodayCount: payments.length,
    };
  }
}

export const adminTodayOperationsRepository = new AdminTodayOperationsRepository();
