-- Attendance is recorded as an explicit outcome. Late check-ins consume a
-- session like attended check-ins; excused absences remain non-attendance.
alter type public."BookingStatus" add value if not exists 'LATE' after 'ATTENDED';
alter type public."BookingStatus" add value if not exists 'EXCUSED' after 'MISSED';
