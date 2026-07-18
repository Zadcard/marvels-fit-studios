import "server-only";

import type {
  BulkUpdateSessionAttendanceInput,
  UpdateSessionAttendanceInput,
} from "@/lib/validators/session-booking";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { BookingStatus, TrainingSessionStatus, TrainingSessionType } from "@/lib/supabase/domain";

type AttendanceBooking = {
  id: string;
  clientId: string;
  status: BookingStatus;
  trainingSession: {
    startsAt: Date;
    status: TrainingSessionStatus;
    type: TrainingSessionType;
  };
};

type AttendanceSubscription = {
  id: string;
  startsAt: Date;
  endsAt: Date | null;
  renewsAt: Date | null;
};

export type AttendanceTransaction = {
  sessionBooking: {
    findUnique(args: Record<string, unknown>): Promise<AttendanceBooking | null>;
    update(args: Record<string, unknown>): Promise<{ id: string }>;
    count(args: Record<string, unknown>): Promise<number>;
  };
  clientSubscription: {
    findMany(args: Record<string, unknown>): Promise<AttendanceSubscription[]>;
    update(args: Record<string, unknown>): Promise<{ id: string }>;
  };
};

export async function runAttendanceTransaction<T>(
  input: UpdateSessionAttendanceInput,
  _operation: (transaction: AttendanceTransaction) => Promise<T>
): Promise<T> {
  void _operation;
  const { data, error } = await getSupabaseServerClient().rpc("update_session_attendance", {
    p_client_id: input.clientId,
    p_status: input.status,
    p_training_session_id: input.trainingSessionId,
  });
  if (error) throw error;
  const result = data[0];
  if (!result) throw new Error("Attendance update returned no record.");
  return result as T;
}

export async function runBulkAttendanceTransaction(
  input: BulkUpdateSessionAttendanceInput,
) {
  const { data, error } = await getSupabaseServerClient().rpc(
    "bulk_update_session_attendance",
    {
      p_client_ids: input.clientIds,
      p_status: input.status,
      p_training_session_id: input.trainingSessionId,
    },
  );
  if (error) throw new Error("The attendance batch could not be saved.");
  return { count: data };
}
