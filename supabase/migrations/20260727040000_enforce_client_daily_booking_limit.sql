-- Migration: 20260727040000_enforce_client_daily_booking_limit.sql
-- Description: Enforces database-level constraint preventing a Client from having >1 active/completed session on the same Africa/Cairo calendar day.

CREATE OR REPLACE FUNCTION public.check_client_daily_booking_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_session_date date;
  v_conflict_count integer;
BEGIN
  -- Only enforce for active/attended/excused/missed/late booking statuses (ignore CANCELED / WAITLISTED)
  IF NEW."status" IN ('BOOKED', 'ATTENDED', 'LATE', 'MISSED', 'EXCUSED') THEN
    SELECT (s."startsAt" AT TIME ZONE 'Africa/Cairo')::date INTO v_session_date
    FROM public."TrainingSession" s
    WHERE s."id" = NEW."trainingSessionId";

    IF v_session_date IS NOT NULL THEN
      SELECT count(*) INTO v_conflict_count
      FROM public."SessionBooking" b
      JOIN public."TrainingSession" ts ON ts."id" = b."trainingSessionId"
      WHERE b."clientId" = NEW."clientId"
        AND b."id" <> NEW."id"
        AND b."status" IN ('BOOKED', 'ATTENDED', 'LATE', 'MISSED', 'EXCUSED')
        AND (ts."startsAt" AT TIME ZONE 'Africa/Cairo')::date = v_session_date;

      IF v_conflict_count > 0 THEN
        RAISE EXCEPTION 'Client already has an active session booking on % (Africa/Cairo timezone limit: 1 session per day)', v_session_date
          USING errcode = '23514';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_client_daily_booking_limit_trigger ON public."SessionBooking";

CREATE TRIGGER enforce_client_daily_booking_limit_trigger
BEFORE INSERT OR UPDATE ON public."SessionBooking"
FOR EACH ROW
EXECUTE FUNCTION public.check_client_daily_booking_limit();
