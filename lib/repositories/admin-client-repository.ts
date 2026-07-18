import "server-only";

import type { AdminClientInitialOption, AdminClientRecord } from "@/lib/dashboard/admin-dashboard-data";
import { withSupabaseFallback } from "@/lib/supabase/errors";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  buildInitialOptions,
  mapAdminClientRecord,
  normalizeAdminClientListFilters,
  type AdminClientListRecord,
} from "@/lib/repositories/admin-client-repository-helpers";

export class AdminClientRepository {
  async list(input?: {
    search?: string;
    initial?: string | null;
    sort?: "asc" | "desc";
  }): Promise<{
    records: AdminClientRecord[];
    totalCount: number;
    filteredCount: number;
    initialOptions: AdminClientInitialOption[];
  }> {
    const filters = normalizeAdminClientListFilters(input);
    const clients = await withSupabaseFallback<AdminClientListRecord[]>(async () => {
      const supabase = getSupabaseServerClient();
      const [clientsResult, ledgerResult] = await Promise.all([
        supabase
          .from("Client")
          .select(
            "id,fullName,phone,sessionsLeft,paymentStatus,status,trialOutcome,trainingCategory,sport,injuryStatus,injuryNotes,restrictions,createdAt,user:User(email,clientId),group:Group(id,name,coach:Coach(fullName)),subscriptions:ClientSubscription(id,status,startsAt,sessionsTotal,plan:SubscriptionPlan(name),payments:Payment(date)),payments:Payment(id,amount,currency,date,method),bookings:SessionBooking(status,trainingSession:TrainingSession(startsAt,title,type,status,coach:Coach(fullName)))"
          ),
        supabase
          .from("BillingLedgerEntry")
          .select("id,clientId,paymentId,receiptNumber,occurredAt")
          .eq("type", "PAYMENT")
          .not("paymentId", "is", null),
      ]);
      if (clientsResult.error) throw clientsResult.error;
      if (ledgerResult.error) throw ledgerResult.error;

      const receiptByPaymentId = new Map(
        ledgerResult.data.flatMap((entry) =>
          entry.paymentId ? [[entry.paymentId, entry] as const] : [],
        ),
      );

      return clientsResult.data.map((client) => {
        const payments = client.payments
          .sort((a, b) => b.date.localeCompare(a.date))
          .map((payment) => ({ ...payment, date: new Date(payment.date) }));
        const receipts = payments.flatMap((payment) => {
          const receipt = receiptByPaymentId.get(payment.id);
          return receipt && receipt.clientId === client.id
            ? [{
                id: receipt.id,
                receiptNumber: receipt.receiptNumber,
                occurredAt: new Date(receipt.occurredAt),
                amount: payment.amount,
                currency: payment.currency,
                method: payment.method,
              }]
            : [];
        });

        return {
        id: client.id,
        fullName: client.fullName,
        phone: client.phone,
        sessionsLeft: client.sessionsLeft,
        paymentStatus: client.paymentStatus,
        status: client.status,
        trialOutcome: client.trialOutcome,
        trainingCategory: client.trainingCategory,
        sport: client.sport,
        injuryStatus: client.injuryStatus,
        injuryNotes: client.injuryNotes,
        restrictions: client.restrictions,
        createdAt: new Date(client.createdAt),
        user: client.user,
        group: client.group,
        subscriptions: client.subscriptions
          .sort((a, b) => b.startsAt.localeCompare(a.startsAt))
          .slice(0, 1)
          .map((subscription) => ({
            ...subscription,
            sessionsTotal: subscription.sessionsTotal,
            payments: subscription.payments
              .sort((a, b) => b.date.localeCompare(a.date))
              .slice(0, 1)
              .map((payment) => ({ date: new Date(payment.date) })),
          })),
        payments,
        receipts,
        bookings: client.bookings
          .filter(
            (booking) =>
              ["BOOKED", "ATTENDED", "MISSED", "WAITLIST"].includes(
                booking.status
              ) && booking.trainingSession.status !== "CANCELED"
          )
          .sort((a, b) =>
            a.trainingSession.startsAt.localeCompare(b.trainingSession.startsAt)
          )
          .slice(0, 3)
          .map((booking) => ({
            trainingSession: {
              ...booking.trainingSession,
              startsAt: new Date(booking.trainingSession.startsAt),
            },
          })),
      };
      });
    }, []);

    const initialNameRecords = clients.map(({ fullName }) => ({ fullName }));
    const search = filters.search.toLowerCase();
    const filteredClients = clients
      .filter((client) => {
        const matchesInitial =
          !filters.initial ||
          client.fullName.toUpperCase().startsWith(filters.initial);
        const matchesSearch =
          !search ||
          [
            client.fullName,
            client.phone,
            client.user.email,
            client.user.clientId,
            client.group?.name,
          ].some((value) => value?.toLowerCase().includes(search));
        return matchesInitial && matchesSearch;
      })
      .sort((a, b) => {
        const result = a.fullName.localeCompare(b.fullName);
        return filters.sort === "desc" ? -result : result;
      });
    const totalCount = clients.length;
    const filteredCount = filteredClients.length;
    const records = filteredClients.map((client) => mapAdminClientRecord(client));
    const initialOptions = buildInitialOptions(initialNameRecords);

    return {
      records,
      totalCount,
      filteredCount,
      initialOptions,
    };
  }
}

export const adminClientRepository = new AdminClientRepository();
