-- Phase 4/7 (attendance): support Marvel's full set of attendance outcomes so an
-- admin can mark today's roster in seconds. CANCELED already exists; add NO_SHOW
-- and RESCHEDULED. Additive — existing booking rows and filters are unaffected.

alter type "BookingStatus" add value if not exists 'NO_SHOW';
alter type "BookingStatus" add value if not exists 'RESCHEDULED';
