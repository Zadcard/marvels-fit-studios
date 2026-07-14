import "server-only";

import type { BookingSource, BookingStatus, TrainingSessionStatus, TrainingSessionType } from "@/lib/supabase/domain";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type SessionRecord = {
  id: string;
  type: TrainingSessionType;
  status: TrainingSessionStatus;
  capacity: number | null;
  bookings: Array<{ id: string; clientId: string; status: BookingStatus }>;
};
type BookingRecord = { id: string; status: BookingStatus };

export interface SessionBookingStore {
  findSession(id: string): Promise<SessionRecord | null>;
  findClient(id: string): Promise<{ id: string } | null>;
  findBooking(sessionId: string, clientId: string): Promise<BookingRecord | null>;
  updateBooking(id: string, data: {
    status: BookingStatus;
    source?: BookingSource;
    bookedAt?: Date;
    attendedAt?: Date | null;
    canceledAt?: Date | null;
  }): Promise<BookingRecord>;
  createBooking(input: {
    trainingSessionId: string;
    clientId: string;
    status: BookingStatus;
    source: BookingSource;
  }): Promise<{ id: string }>;
}

export function getSessionBookingStore(): SessionBookingStore {
  const supabase = getSupabaseServerClient();
  return {
    async findSession(id) {
      const { data, error } = await supabase
        .from("TrainingSession")
        .select("id,type,status,capacity,bookings:SessionBooking(id,clientId,status)")
        .eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
    async findClient(id) {
      const { data, error } = await supabase.from("Client").select("id").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
    async findBooking(sessionId, clientId) {
      const { data, error } = await supabase.from("SessionBooking").select("id,status")
        .eq("trainingSessionId", sessionId).eq("clientId", clientId).maybeSingle();
      if (error) throw error;
      return data;
    },
    async updateBooking(id, data) {
      const update = {
        ...data,
        bookedAt: data.bookedAt?.toISOString(),
        attendedAt: data.attendedAt instanceof Date ? data.attendedAt.toISOString() : data.attendedAt,
        canceledAt: data.canceledAt instanceof Date ? data.canceledAt.toISOString() : data.canceledAt,
      };
      const { data: result, error } = await supabase.from("SessionBooking")
        .update(update).eq("id", id).select("id,status").single();
      if (error) throw error;
      return result;
    },
    async createBooking(input) {
      const { data, error } = await supabase.from("SessionBooking").insert(input).select("id").single();
      if (error) throw error;
      return data;
    },
  };
}
