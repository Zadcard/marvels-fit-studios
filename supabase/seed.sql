-- Marvel Operations demo data -------------------------------------------------
--
-- This fixture is intentionally additive: it uses stable demo IDs and never
-- deletes or overwrites an existing record. It gives the connected dashboard a
-- real admin -> coach -> group -> client -> session -> booking path to test.
--
-- Demo sign-in accounts (email login):
--   admin@marvelfitness.demo / MarvelAdmin2026!
--   ahmed.waheed@marvelfitness.demo / MarvelCoach2026!

insert into public."User" ("id", "name", "clientId", "email", "password", "mustChangePassword", "role") values
  ('demo-user-admin', 'Marvel Admin', 'MFS-ADMIN-01', 'admin@marvelfitness.demo', '$2b$12$0OGM4ZCYXGgTgpUpihXGB.XWRQZGhkrnGWhG3A5u9w6xxGWDts4XS', false, 'ADMIN'),
  ('demo-user-ahmed', 'Ahmed Waheed', 'MFS-COACH-01', 'ahmed.waheed@marvelfitness.demo', '$2b$12$sMY5A.g.E77mnHQS6vkZ.uyUuMplN2ObwrrlgYoZI3TpanLC1sv8O', false, 'COACH'),
  ('demo-user-omar', 'Omar Tarek', 'MFS-2605001', 'omar.tarek@marvelfitness.demo', null, false, 'CLIENT'),
  ('demo-user-sara', 'Sara Nabil', 'MFS-2605002', 'sara.nabil@marvelfitness.demo', null, false, 'CLIENT'),
  ('demo-user-ali', 'Ali Hassan', 'MFS-2605003', 'ali.hassan@marvelfitness.demo', null, false, 'CLIENT'),
  ('demo-user-tamer', 'Tamer Fouad', 'MFS-2605004', 'tamer.fouad@marvelfitness.demo', null, false, 'CLIENT'),
  ('demo-user-hazem', 'Hazem Salah', 'MFS-2605005', 'hazem.salah@marvelfitness.demo', null, false, 'CLIENT'),
  ('demo-user-mohab', 'Mohab Ehab', 'MFS-2605006', 'mohab.ehab@marvelfitness.demo', null, false, 'CLIENT'),
  ('demo-user-nour', 'Nour Rashad', 'MFS-COACH-02', 'nour.rashad@marvelfitness.demo', '$2b$12$sMY5A.g.E77mnHQS6vkZ.uyUuMplN2ObwrrlgYoZI3TpanLC1sv8O', false, 'COACH'),
  ('demo-user-mariam', 'Mariam Soliman', 'MFS-COACH-03', 'mariam.soliman@marvelfitness.demo', '$2b$12$sMY5A.g.E77mnHQS6vkZ.uyUuMplN2ObwrrlgYoZI3TpanLC1sv8O', false, 'COACH'),
  ('demo-user-youssef', 'Youssef Abdelatif', 'MFS-COACH-04', 'youssef.abdelatif@marvelfitness.demo', '$2b$12$sMY5A.g.E77mnHQS6vkZ.uyUuMplN2ObwrrlgYoZI3TpanLC1sv8O', false, 'COACH'),
  ('demo-user-khaled', 'Khaled Habib', 'MFS-COACH-05', 'khaled.habib@marvelfitness.demo', '$2b$12$sMY5A.g.E77mnHQS6vkZ.uyUuMplN2ObwrrlgYoZI3TpanLC1sv8O', false, 'COACH'),
  ('demo-user-nada', 'Nada Sherif', 'MFS-2605007', 'nada.sherif@marvelfitness.demo', null, false, 'CLIENT'),
  ('demo-user-reham', 'Reham Badawy', 'MFS-2605008', 'reham.badawy@marvelfitness.demo', null, false, 'CLIENT'),
  ('demo-user-habiba', 'Habiba Wael', 'MFS-2605009', 'habiba.wael@marvelfitness.demo', null, false, 'CLIENT'),
  ('demo-user-yassin', 'Yassin Adel', 'MFS-2605010', 'yassin.adel@marvelfitness.demo', null, false, 'CLIENT'),
  ('demo-user-ziad', 'Ziad Khaled', 'MFS-2605011', 'ziad.khaled@marvelfitness.demo', null, false, 'CLIENT'),
  ('demo-user-karim', 'Karim Samir', 'MFS-2605012', 'karim.samir@marvelfitness.demo', null, false, 'CLIENT'),
  ('demo-user-laila', 'Laila Mansour', 'MFS-2605013', 'laila.mansour@marvelfitness.demo', null, false, 'CLIENT'),
  ('demo-user-menna', 'Menna Tarek', 'MFS-2605014', 'menna.tarek@marvelfitness.demo', null, false, 'CLIENT')
on conflict do nothing;

insert into public."Coach" ("id", "fullName", "phone", "specialization", "userId") values
  ('demo-coach-ahmed', 'Ahmed Waheed', '+20 100 555 0101', 'STRENGTH', 'demo-user-ahmed'),
  ('demo-coach-nour', 'Nour Rashad', '+20 100 555 0102', 'CONDITIONING', 'demo-user-nour'),
  ('demo-coach-mariam', 'Mariam Soliman', '+20 100 555 0103', 'REHAB', 'demo-user-mariam'),
  ('demo-coach-youssef', 'Youssef Abdelatif', '+20 100 555 0104', 'ATHLETIC_PERFORMANCE', 'demo-user-youssef'),
  ('demo-coach-khaled', 'Khaled Habib', '+20 100 555 0105', 'CALISTHENICS', 'demo-user-khaled')
on conflict do nothing;

insert into public."Group" ("id", "name", "type", "coachId", "trainingCategory", "capacity", "isActive", "notes") values
  ('demo-group-strength', 'Strength Class', 'GROUP', 'demo-coach-ahmed', 'MUSCLE_GAIN', 16, true, 'Demo group for the Marvel Operations connected UI.'),
  ('demo-group-burning', 'Burning Class', 'GROUP', 'demo-coach-nour', 'FAT_LOSS', 16, true, 'High-energy conditioning with scalable intervals and a metabolic focus.'),
  ('demo-group-ladies', 'Ladies Class', 'GROUP', 'demo-coach-mariam', 'GENERAL_FITNESS', 14, true, 'Strength, mobility, and low-impact conditioning with injury context visible.'),
  ('demo-group-athlete', 'Athlete Conditioning', 'GROUP', 'demo-coach-youssef', 'FOOTBALL', 12, true, 'Speed, change of direction, and sport-specific conditioning.'),
  ('demo-group-calisthenics', 'Calisthenics', 'GROUP', 'demo-coach-khaled', 'CALISTHENICS', 12, true, 'Bodyweight strength, movement quality, and skill progressions.')
on conflict do nothing;

insert into public."Client" ("id", "fullName", "phone", "userId", "membershipType", "sessionsLeft", "isPaid", "paymentStatus", "status", "groupId", "trainingCategory", "injuryStatus", "injuryNotes", "restrictions") values
  ('demo-client-omar', 'Omar Tarek', '+20 100 221 3411', 'demo-user-omar', 'monthly', 11, true, 'PAID', 'ACTIVE', 'demo-group-strength', 'MUSCLE_GAIN', 'NONE', null, null),
  ('demo-client-sara', 'Sara Nabil', '+20 109 882 1145', 'demo-user-sara', 'monthly', 2, true, 'PAID', 'ACTIVE', 'demo-group-strength', 'MUSCLE_GAIN', 'REHAB', 'Post-op knee - avoid deep flexion', 'Avoid deep knee flexion.'),
  ('demo-client-ali', 'Ali Hassan', '+20 122 734 2210', 'demo-user-ali', 'monthly', 10, true, 'PAID', 'ACTIVE', 'demo-group-strength', 'MUSCLE_GAIN', 'CURRENT', 'ACL recovery - modify squat depth', 'Keep squat range pain-free.'),
  ('demo-client-tamer', 'Tamer Fouad', '+20 122 900 3341', 'demo-user-tamer', 'trial', 1, false, 'DUE_SOON', 'TRIAL', 'demo-group-strength', 'MUSCLE_GAIN', 'NONE', null, null),
  ('demo-client-hazem', 'Hazem Salah', '+20 115 444 8890', 'demo-user-hazem', 'monthly', 8, true, 'PAID', 'ACTIVE', 'demo-group-strength', 'MUSCLE_GAIN', 'NONE', null, null),
  ('demo-client-mohab', 'Mohab Ehab', '+20 127 551 4420', 'demo-user-mohab', 'monthly', 8, true, 'PAID', 'ACTIVE', 'demo-group-strength', 'MUSCLE_GAIN', 'NONE', null, null),
  ('demo-client-nada', 'Nada Sherif', '+20 114 522 9087', 'demo-user-nada', 'monthly', 9, true, 'PAID', 'ACTIVE', 'demo-group-ladies', 'GENERAL_FITNESS', 'NONE', null, null),
  ('demo-client-reham', 'Reham Badawy', '+20 111 409 3388', 'demo-user-reham', 'monthly', 0, false, 'UNPAID', 'PAUSED', 'demo-group-ladies', 'GENERAL_FITNESS', 'NONE', null, null),
  ('demo-client-habiba', 'Habiba Wael', '+20 115 662 7740', 'demo-user-habiba', 'monthly', 15, true, 'PAID', 'ACTIVE', 'demo-group-ladies', 'GENERAL_FITNESS', 'NONE', null, null),
  ('demo-client-yassin', 'Yassin Adel', '+20 100 553 8842', 'demo-user-yassin', 'trial', 0, false, 'DUE_SOON', 'TRIAL', 'demo-group-athlete', 'FOOTBALL', 'CURRENT', 'Wrist - tape for heavy pulling', 'Keep heavy pulling pain-free.'),
  ('demo-client-ziad', 'Ziad Khaled', '+20 103 847 6690', 'demo-user-ziad', 'monthly', 13, true, 'PAID', 'ACTIVE', 'demo-group-athlete', 'FOOTBALL', 'NONE', null, null),
  ('demo-client-karim', 'Karim Samir', '+20 101 334 5512', 'demo-user-karim', 'monthly', 1, false, 'DUE_SOON', 'ACTIVE', 'demo-group-burning', 'FAT_LOSS', 'NONE', null, null),
  ('demo-client-laila', 'Laila Mansour', '+20 102 334 5513', 'demo-user-laila', 'monthly', 1, false, 'DUE_SOON', 'ACTIVE', 'demo-group-calisthenics', 'CALISTHENICS', 'NONE', null, null),
  ('demo-client-menna', 'Menna Tarek', '+20 100 334 5514', 'demo-user-menna', 'monthly', 15, true, 'PAID', 'ACTIVE', 'demo-group-ladies', 'GENERAL_FITNESS', 'NONE', null, null)
on conflict do nothing;

insert into public."SubscriptionPlan" ("id", "name", "slug", "description", "billingCycle", "sessionsIncluded", "price", "currency", "isActive") values
  ('demo-plan-group', 'Group Monthly', 'demo-group-monthly', 'Monthly group membership', 'MONTHLY', 16, 1400, 'EGP', true),
  ('demo-plan-ladies', 'Ladies Monthly', 'demo-ladies-monthly', 'Monthly ladies group membership', 'MONTHLY', 16, 1300, 'EGP', true),
  ('demo-plan-athlete', 'Athlete Bundle', 'demo-athlete-bundle', 'Twenty athlete conditioning sessions', 'MONTHLY', 20, 2800, 'EGP', true),
  ('demo-plan-calisthenics', 'Calisthenics Monthly', 'demo-calisthenics-monthly', 'Monthly calisthenics membership', 'MONTHLY', 12, 1600, 'EGP', true)
on conflict do nothing;

insert into public."ClientSubscription" ("id", "clientId", "planId", "status", "startsAt", "endsAt", "renewsAt", "sessionsTotal", "sessionsUsed", "isAutoRenew") values
  ('demo-sub-omar', 'demo-client-omar', 'demo-plan-group', 'ACTIVE', current_date - interval '20 days', current_date + interval '10 days', current_date + interval '10 days', 16, 5, true),
  ('demo-sub-sara', 'demo-client-sara', 'demo-plan-group', 'ACTIVE', current_date - interval '27 days', current_date + interval '2 days', current_date + interval '2 days', 12, 10, false),
  ('demo-sub-ali', 'demo-client-ali', 'demo-plan-group', 'ACTIVE', current_date - interval '17 days', current_date + interval '13 days', current_date + interval '13 days', 16, 6, true),
  ('demo-sub-tamer', 'demo-client-tamer', 'demo-plan-group', 'TRIAL', current_date - interval '3 days', current_date + interval '4 days', current_date + interval '4 days', 1, 1, false),
  ('demo-sub-hazem', 'demo-client-hazem', 'demo-plan-group', 'ACTIVE', current_date - interval '14 days', current_date + interval '16 days', current_date + interval '16 days', 16, 8, true),
  ('demo-sub-mohab', 'demo-client-mohab', 'demo-plan-group', 'ACTIVE', current_date - interval '9 days', current_date + interval '21 days', current_date + interval '21 days', 16, 8, true),
  ('demo-sub-nada', 'demo-client-nada', 'demo-plan-ladies', 'ACTIVE', current_date - interval '21 days', current_date + interval '9 days', current_date + interval '9 days', 16, 7, true),
  ('demo-sub-reham', 'demo-client-reham', 'demo-plan-ladies', 'PAUSED', current_date - interval '30 days', current_date - interval '1 day', current_date - interval '1 day', 8, 8, false),
  ('demo-sub-habiba', 'demo-client-habiba', 'demo-plan-ladies', 'ACTIVE', current_date - interval '16 days', current_date + interval '14 days', current_date + interval '14 days', 16, 1, true),
  ('demo-sub-yassin', 'demo-client-yassin', 'demo-plan-athlete', 'TRIAL', current_date - interval '1 day', current_date + interval '6 days', current_date + interval '6 days', 1, 1, false),
  ('demo-sub-ziad', 'demo-client-ziad', 'demo-plan-athlete', 'ACTIVE', current_date - interval '12 days', current_date + interval '18 days', current_date + interval '18 days', 20, 7, true),
  ('demo-sub-karim', 'demo-client-karim', 'demo-plan-group', 'ACTIVE', current_date - interval '27 days', current_date + interval '3 days', current_date + interval '3 days', 12, 11, false),
  ('demo-sub-laila', 'demo-client-laila', 'demo-plan-calisthenics', 'ACTIVE', current_date - interval '26 days', current_date + interval '5 days', current_date + interval '5 days', 8, 7, false),
  ('demo-sub-menna', 'demo-client-menna', 'demo-plan-ladies', 'ACTIVE', current_date - interval '11 days', current_date + interval '19 days', current_date + interval '19 days', 16, 1, true)
on conflict do nothing;

insert into public."RecurringSessionTemplate" ("id", "title", "description", "type", "status", "coachId", "groupId", "location", "capacity", "weekday", "localStartTime", "durationMinutes", "startsOn", "active", "createdById") values
  ('00000000-0000-4000-8000-000000000101', 'Strength Class', 'Compound lifts and progressive loading.', 'GROUP', 'SCHEDULED', 'demo-coach-ahmed', 'demo-group-strength', 'Main floor', 16, 0, '17:00', 60, current_date - interval '30 days', true, 'demo-user-admin'),
  ('00000000-0000-4000-8000-000000000102', 'Burning Class', 'Conditioning circuit with progressive intensity.', 'GROUP', 'SCHEDULED', 'demo-coach-nour', 'demo-group-burning', 'Main floor', 16, 0, '07:00', 60, current_date - interval '30 days', true, 'demo-user-admin'),
  ('00000000-0000-4000-8000-000000000103', 'Ladies Class', 'Strength, mobility, and low-impact conditioning.', 'GROUP', 'SCHEDULED', 'demo-coach-mariam', 'demo-group-ladies', 'Main floor', 14, 0, '09:00', 60, current_date - interval '30 days', true, 'demo-user-admin'),
  ('00000000-0000-4000-8000-000000000104', 'Athlete Conditioning', 'Speed and change-of-direction work.', 'GROUP', 'SCHEDULED', 'demo-coach-youssef', 'demo-group-athlete', 'Outdoor zone', 12, 0, '18:30', 60, current_date - interval '30 days', true, 'demo-user-admin'),
  ('00000000-0000-4000-8000-000000000105', 'Calisthenics', 'Bodyweight strength and movement skill.', 'GROUP', 'SCHEDULED', 'demo-coach-khaled', 'demo-group-calisthenics', 'Rig zone', 12, 0, '20:00', 60, current_date - interval '30 days', true, 'demo-user-admin')
on conflict do nothing;

insert into public."TrainingSession" ("id", "title", "description", "type", "status", "startsAt", "endsAt", "capacity", "location", "coachId", "groupId", "createdById", "sourceTemplateId") values
  ('demo-session-burning-today', 'Burning Class', 'Conditioning circuit with progressive intensity.', 'GROUP', 'SCHEDULED', current_date + time '07:00', current_date + time '08:00', 16, 'Main floor', 'demo-coach-nour', 'demo-group-burning', 'demo-user-admin', '00000000-0000-4000-8000-000000000102'),
  ('demo-session-ladies-today', 'Ladies Class', 'Strength, mobility, and low-impact conditioning.', 'GROUP', 'SCHEDULED', current_date + time '09:00', current_date + time '10:00', 14, 'Main floor', 'demo-coach-mariam', 'demo-group-ladies', 'demo-user-admin', '00000000-0000-4000-8000-000000000103'),
  ('demo-session-athlete-today', 'Athlete Conditioning', 'Speed and change-of-direction work.', 'GROUP', 'SCHEDULED', current_date + time '18:30', current_date + time '19:30', 12, 'Outdoor zone', 'demo-coach-youssef', 'demo-group-athlete', 'demo-user-admin', '00000000-0000-4000-8000-000000000104'),
  ('demo-session-calisthenics-today', 'Calisthenics', 'Bodyweight strength and movement skill.', 'GROUP', 'SCHEDULED', current_date + time '20:00', current_date + time '21:00', 12, 'Rig zone', 'demo-coach-khaled', 'demo-group-calisthenics', 'demo-user-admin', '00000000-0000-4000-8000-000000000105'),
  ('demo-session-strength-next', 'Strength Class', 'Compound lifts and progressive loading.', 'GROUP', 'SCHEDULED', current_date + interval '2 days' + time '17:00', current_date + interval '2 days' + time '18:00', 16, 'Main floor', 'demo-coach-ahmed', 'demo-group-strength', 'demo-user-admin', '00000000-0000-4000-8000-000000000101'),
  ('demo-session-burning-next', 'Burning Class', 'Conditioning circuit with progressive intensity.', 'GROUP', 'SCHEDULED', current_date + interval '2 days' + time '07:00', current_date + interval '2 days' + time '08:00', 16, 'Main floor', 'demo-coach-nour', 'demo-group-burning', 'demo-user-admin', '00000000-0000-4000-8000-000000000102'),
  ('demo-session-ladies-next', 'Ladies Class', 'Strength, mobility, and low-impact conditioning.', 'GROUP', 'SCHEDULED', current_date + interval '3 days' + time '09:00', current_date + interval '3 days' + time '10:00', 14, 'Main floor', 'demo-coach-mariam', 'demo-group-ladies', 'demo-user-admin', '00000000-0000-4000-8000-000000000103'),
  ('demo-session-athlete-next', 'Athlete Conditioning', 'Speed and change-of-direction work.', 'GROUP', 'SCHEDULED', current_date + interval '3 days' + time '18:30', current_date + interval '3 days' + time '19:30', 12, 'Outdoor zone', 'demo-coach-youssef', 'demo-group-athlete', 'demo-user-admin', '00000000-0000-4000-8000-000000000104')
on conflict do nothing;

insert into public."SessionBooking" ("id", "trainingSessionId", "clientId", "status", "source", "attendedAt") values
  ('demo-booking-nada-today', 'demo-session-ladies-today', 'demo-client-nada', 'ATTENDED', 'MANUAL', current_timestamp),
  ('demo-booking-reham-today', 'demo-session-ladies-today', 'demo-client-reham', 'BOOKED', 'MANUAL', null),
  ('demo-booking-habiba-today', 'demo-session-ladies-today', 'demo-client-habiba', 'ATTENDED', 'MANUAL', current_timestamp),
  ('demo-booking-karim-today', 'demo-session-burning-today', 'demo-client-karim', 'BOOKED', 'MANUAL', null),
  ('demo-booking-yassin-today', 'demo-session-athlete-today', 'demo-client-yassin', 'BOOKED', 'MANUAL', null),
  ('demo-booking-ziad-today', 'demo-session-athlete-today', 'demo-client-ziad', 'BOOKED', 'MANUAL', null),
  ('demo-booking-laila-today', 'demo-session-calisthenics-today', 'demo-client-laila', 'BOOKED', 'MANUAL', null),
  ('demo-booking-menna-today', 'demo-session-ladies-today', 'demo-client-menna', 'BOOKED', 'MANUAL', null),
  ('demo-booking-omar-next', 'demo-session-strength-next', 'demo-client-omar', 'BOOKED', 'MANUAL', null),
  ('demo-booking-ali-next', 'demo-session-strength-next', 'demo-client-ali', 'BOOKED', 'MANUAL', null),
  ('demo-booking-karim-next', 'demo-session-burning-next', 'demo-client-karim', 'BOOKED', 'MANUAL', null),
  ('demo-booking-nada-next', 'demo-session-ladies-next', 'demo-client-nada', 'BOOKED', 'MANUAL', null),
  ('demo-booking-yassin-next', 'demo-session-athlete-next', 'demo-client-yassin', 'BOOKED', 'MANUAL', null)
on conflict do nothing;

insert into public."Payment" ("id", "amount", "currency", "date", "method", "note", "clientId", "clientSubscriptionId") values
  ('payomar0001', 1400, 'EGP', current_date + time '15:40', 'INSTA_PAY', 'Omar Tarek group monthly renewal', 'demo-client-omar', 'demo-sub-omar'),
  ('paysara0001', 1400, 'EGP', current_date + time '17:02', 'VISA', 'Sara Nabil group renewal', 'demo-client-sara', 'demo-sub-sara'),
  ('paynada0001', 1300, 'EGP', current_date + time '13:15', 'CASH', 'Nada Sherif ladies monthly renewal', 'demo-client-nada', 'demo-sub-nada'),
  ('payziad0001', 2800, 'EGP', current_date - interval '1 day', 'INSTA_PAY', 'Ziad Khaled athlete bundle', 'demo-client-ziad', 'demo-sub-ziad')
on conflict do nothing;

update public."Payment"
set "method" = case id
  when 'payomar0001' then 'INSTA_PAY'
  when 'paysara0001' then 'VISA'
  when 'paynada0001' then 'CASH'
  when 'payziad0001' then 'INSTA_PAY'
end
where id in ('payomar0001', 'paysara0001', 'paynada0001', 'payziad0001')
  and "method" is null;

insert into public."Lead" ("id", "fullName", "phone", "email", "message", "source", "status") values
  ('demo-lead-hana', 'Hana Mahmoud', '+20 100 442 1180', 'hana.mahmoud@marvelfitness.demo', 'Prefers morning sessions and wants Ladies Class.', 'WhatsApp', 'NEW'),
  ('demo-lead-farida', 'Farida Ashraf', '+20 106 771 2093', 'farida.ashraf@marvelfitness.demo', 'Trial booked for a Ladies Class session.', 'Instagram', 'CONTACTED'),
  ('demo-lead-rana', 'Rana Ehab', '+20 114 662 9930', 'rana.ehab@marvelfitness.demo', 'Deciding on a Burning Class membership.', 'WhatsApp', 'CONTACTED'),
  ('demo-lead-nour', 'Nour Hassan', '+20 101 334 5512', 'nour.hassan@marvelfitness.demo', 'Subscribed to a group monthly plan.', 'Instagram', 'CONVERTED'),
  ('demo-lead-sherif', 'Sherif Adel', '+20 128 990 1123', 'sherif.adel@marvelfitness.demo', 'Chose a gym closer to home.', 'Call', 'CLOSED')
on conflict do nothing;

insert into public."Notification" ("recipientId", "kind", "status", "title", "body", "href", "dedupeKey") values
  ('demo-user-admin', 'RENEWAL_REMINDER', 'SENT', 'Three subscriptions renew this week', 'Review members with payment due soon before their renewal date.', '/admin/subscriptions', 'demo-admin-renewals-week'),
  ('demo-user-admin', 'SESSION_REMINDER', 'SENT', 'Attendance is ready for Strength Class', 'Six members are booked into today''s 5:00 PM Strength Class.', '/admin/attendance?session=demo-session-strength-today', 'demo-admin-strength-attendance'),
  ('demo-user-admin', 'SYSTEM', 'SENT', 'New lead captured from WhatsApp', 'Hana Mahmoud is interested in Ladies Class morning sessions.', '/admin/join-requests', 'demo-admin-new-lead-hana'),
  ('demo-user-ahmed', 'SESSION_REMINDER', 'SENT', 'Strength Class roster is available', 'Open the roster before the 5:00 PM session to review client context.', '/coach', 'demo-coach-strength-roster'),
  ('demo-user-ahmed', 'SYSTEM', 'SENT', 'Client injury context updated', 'Ali Hassan has an ACL recovery note on his client profile.', '/coach/clients', 'demo-coach-ali-injury')
on conflict ("dedupeKey") do nothing;

insert into public."TrainingSession" ("id", "title", "description", "type", "status", "startsAt", "endsAt", "capacity", "location", "coachId", "groupId", "createdById") values
  ('demo-session-strength-today', 'Strength Class', 'Connected Marvel attendance demo.', 'GROUP', 'SCHEDULED', current_date + time '17:00', current_date + time '18:00', 16, 'Main floor', 'demo-coach-ahmed', 'demo-group-strength', 'demo-user-admin')
on conflict do nothing;

insert into public."SessionBooking" ("id", "trainingSessionId", "clientId", "status", "source", "attendedAt") values
  ('demo-booking-omar', 'demo-session-strength-today', 'demo-client-omar', 'ATTENDED', 'MANUAL', current_timestamp),
  ('demo-booking-sara', 'demo-session-strength-today', 'demo-client-sara', 'ATTENDED', 'MANUAL', current_timestamp),
  ('demo-booking-ali', 'demo-session-strength-today', 'demo-client-ali', 'ATTENDED', 'MANUAL', current_timestamp),
  ('demo-booking-tamer', 'demo-session-strength-today', 'demo-client-tamer', 'ATTENDED', 'MANUAL', current_timestamp),
  ('demo-booking-hazem', 'demo-session-strength-today', 'demo-client-hazem', 'ATTENDED', 'MANUAL', current_timestamp),
  ('demo-booking-mohab', 'demo-session-strength-today', 'demo-client-mohab', 'MISSED', 'MANUAL', null)
on conflict do nothing;

-- Additional teams, groups, and operational records used by the remaining
-- Marvel screens. These stay fixture-only and preserve every non-demo row.
insert into public."User" ("id", "name", "clientId", "email", "password", "mustChangePassword", "role") values
  ('demo-user-nour', 'Nour Rashad', 'MFS-COACH-02', 'nour.rashad@marvelfitness.demo', '$2b$12$sMY5A.g.E77mnHQS6vkZ.uyUuMplN2ObwrrlgYoZI3TpanLC1sv8O', false, 'COACH'),
  ('demo-user-mariam', 'Mariam Soliman', 'MFS-COACH-03', 'mariam.soliman@marvelfitness.demo', '$2b$12$sMY5A.g.E77mnHQS6vkZ.uyUuMplN2ObwrrlgYoZI3TpanLC1sv8O', false, 'COACH'),
  ('demo-user-youssef', 'Youssef Abdelatif', 'MFS-COACH-04', 'youssef.abdelatif@marvelfitness.demo', '$2b$12$sMY5A.g.E77mnHQS6vkZ.uyUuMplN2ObwrrlgYoZI3TpanLC1sv8O', false, 'COACH'),
  ('demo-user-khaled', 'Khaled Habib', 'MFS-COACH-05', 'khaled.habib@marvelfitness.demo', '$2b$12$sMY5A.g.E77mnHQS6vkZ.uyUuMplN2ObwrrlgYoZI3TpanLC1sv8O', false, 'COACH'),
  ('demo-user-nada', 'Nada Sherif', 'MFS-2605007', 'nada.sherif@marvelfitness.demo', null, false, 'CLIENT'),
  ('demo-user-reham', 'Reham Badawy', 'MFS-2605008', 'reham.badawy@marvelfitness.demo', null, false, 'CLIENT'),
  ('demo-user-habiba', 'Habiba Wael', 'MFS-2605009', 'habiba.wael@marvelfitness.demo', null, false, 'CLIENT'),
  ('demo-user-yassin', 'Yassin Adel', 'MFS-2605010', 'yassin.adel@marvelfitness.demo', null, false, 'CLIENT'),
  ('demo-user-ziad', 'Ziad Khaled', 'MFS-2605011', 'ziad.khaled@marvelfitness.demo', null, false, 'CLIENT'),
  ('demo-user-karim', 'Karim Samir', 'MFS-2605012', 'karim.samir@marvelfitness.demo', null, false, 'CLIENT'),
  ('demo-user-laila', 'Laila Mansour', 'MFS-2605013', 'laila.mansour@marvelfitness.demo', null, false, 'CLIENT'),
  ('demo-user-menna', 'Menna Tarek', 'MFS-2605014', 'menna.tarek@marvelfitness.demo', null, false, 'CLIENT')
on conflict do nothing;

insert into public."Coach" ("id", "fullName", "phone", "specialization", "userId") values
  ('demo-coach-nour', 'Nour Rashad', '+20 100 555 0102', 'CONDITIONING', 'demo-user-nour'),
  ('demo-coach-mariam', 'Mariam Soliman', '+20 100 555 0103', 'REHAB', 'demo-user-mariam'),
  ('demo-coach-youssef', 'Youssef Abdelatif', '+20 100 555 0104', 'ATHLETIC_PERFORMANCE', 'demo-user-youssef'),
  ('demo-coach-khaled', 'Khaled Habib', '+20 100 555 0105', 'CALISTHENICS', 'demo-user-khaled')
on conflict do nothing;

insert into public."Group" ("id", "name", "type", "coachId", "trainingCategory", "capacity", "isActive", "notes") values
  ('demo-group-burning', 'Burning Class', 'GROUP', 'demo-coach-nour', 'FAT_LOSS', 16, true, 'High-energy conditioning with scalable intervals and a metabolic focus.'),
  ('demo-group-ladies', 'Ladies Class', 'GROUP', 'demo-coach-mariam', 'GENERAL_FITNESS', 14, true, 'Strength, mobility, and low-impact conditioning with injury context visible.'),
  ('demo-group-athlete', 'Athlete Conditioning', 'GROUP', 'demo-coach-youssef', 'FOOTBALL', 12, true, 'Speed, change of direction, and sport-specific conditioning.'),
  ('demo-group-calisthenics', 'Calisthenics', 'GROUP', 'demo-coach-khaled', 'CALISTHENICS', 12, true, 'Bodyweight strength, movement quality, and skill progressions.')
on conflict do nothing;

insert into public."Client" ("id", "fullName", "phone", "userId", "membershipType", "sessionsLeft", "isPaid", "paymentStatus", "status", "groupId", "trainingCategory", "injuryStatus", "injuryNotes", "restrictions") values
  ('demo-client-nada', 'Nada Sherif', '+20 114 522 9087', 'demo-user-nada', 'monthly', 9, true, 'PAID', 'ACTIVE', 'demo-group-ladies', 'GENERAL_FITNESS', 'NONE', null, null),
  ('demo-client-reham', 'Reham Badawy', '+20 111 409 3388', 'demo-user-reham', 'monthly', 0, false, 'UNPAID', 'PAUSED', 'demo-group-ladies', 'GENERAL_FITNESS', 'NONE', null, null),
  ('demo-client-habiba', 'Habiba Wael', '+20 115 662 7740', 'demo-user-habiba', 'monthly', 15, true, 'PAID', 'ACTIVE', 'demo-group-ladies', 'GENERAL_FITNESS', 'NONE', null, null),
  ('demo-client-yassin', 'Yassin Adel', '+20 100 553 8842', 'demo-user-yassin', 'trial', 0, false, 'DUE_SOON', 'TRIAL', 'demo-group-athlete', 'FOOTBALL', 'CURRENT', 'Wrist - tape for heavy pulling', 'Keep heavy pulling pain-free.'),
  ('demo-client-ziad', 'Ziad Khaled', '+20 103 847 6690', 'demo-user-ziad', 'monthly', 13, true, 'PAID', 'ACTIVE', 'demo-group-athlete', 'FOOTBALL', 'NONE', null, null),
  ('demo-client-karim', 'Karim Samir', '+20 101 334 5512', 'demo-user-karim', 'monthly', 1, false, 'DUE_SOON', 'ACTIVE', 'demo-group-burning', 'FAT_LOSS', 'NONE', null, null),
  ('demo-client-laila', 'Laila Mansour', '+20 102 334 5513', 'demo-user-laila', 'monthly', 1, false, 'DUE_SOON', 'ACTIVE', 'demo-group-calisthenics', 'CALISTHENICS', 'NONE', null, null),
  ('demo-client-menna', 'Menna Tarek', '+20 100 334 5514', 'demo-user-menna', 'monthly', 15, true, 'PAID', 'ACTIVE', 'demo-group-ladies', 'GENERAL_FITNESS', 'NONE', null, null)
on conflict do nothing;
