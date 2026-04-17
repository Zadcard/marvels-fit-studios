# Backend Testing Guide

Run these checks first:

```powershell
npm run dev
npm run check:backend
npm run lint
npx tsc --noEmit
npm run build
```

Note:

- During `npm run check:backend` or `npm run build`, the database driver may print an SSL warning about `sslmode=prefer`, `sslmode=require`, or `sslmode=verify-ca` being treated as `verify-full`. This warning does not fail the backend checks or build. Before production, update the Neon `DATABASE_URL` SSL mode intentionally, preferably to `sslmode=verify-full` if we want to keep the current stricter behavior.

- The implemented backend feature: Authentication and role protection

This protects admin, coach, and client areas with server-side role checks. Private server actions now use shared guards, so users cannot mutate records from the wrong role.

. Log in as admin and confirm `/admin`, `/admin/clients`, `/admin/coaches`, `/admin/sessions`, `/admin/subscriptions`, `/admin/settings`, and `/admin/profile` open.
. Log in as coach and confirm coach pages open, then try visiting `/admin` and confirm access is blocked or redirected.
. Log in as client and confirm client pages open, then try visiting `/coach` and `/admin` and confirm access is blocked or redirected.

- The implemented backend feature: Join Now lead capture and admin lead approval

The landing Join Now form saves a real `Lead` with a hashed password. Admin approval promotes a lead into a real `User` plus `Client` profile.

. Submit the Join Now form with a new name, phone, email, and password.
. Log in as admin, open `/admin/leads`, find the new lead, and click `Approve as client`.
. Confirm the lead becomes `Converted`, appears in `/admin/clients`, and can log in as a client with the password submitted on the form.

- The implemented backend feature: Admin client management

Admins can create, edit, and delete real client accounts. Client profile, status, payment status, payment records, and initial or reset password all persist in the database.

. Open `/admin/clients`, create a client with full name, email, phone, status, and an initial password.
. Log out and log in as that client using the initial password.
. Edit that client, change profile fields or status, save, refresh, and confirm the table keeps the new values.
. Edit that client again, enter a reset password, save, and confirm the old password no longer works while the new one works.
. Delete a test client by typing `Delete`, refresh, and confirm they disappear from admin and coach/client-related views.

- The implemented backend feature: Admin coach management

Admins can create, edit, and delete real coach accounts. Coach profile, specialization, and initial or reset password all persist in the database.

. Open `/admin/coaches`, create a coach with full name, email, phone, specialization, and an initial password.
. Log out and log in as that coach using the initial password.
. Edit the coach specialization or contact info, save, refresh, and confirm the values persist.
. Enter a reset password for the coach, save, and confirm the new password works.
. Try deleting a coach with assigned sessions or groups and confirm the backend blocks unsafe deletion.

- The implemented backend feature: Admin session lifecycle

Admins can create, edit, cancel, and delete real training sessions. Session capacity, private-session rules, coach assignment, and canceled-session cleanup are enforced.

. Open `/admin/sessions`, create a group session with a coach, date, time, location, and capacity.
. Create a private session and confirm capacity behaves as one client max.
. Edit a session's coach, timing, location, status, or capacity and confirm the changes appear after refresh.
. Cancel a session and confirm active bookings are canceled or hidden from active views.
. Delete a test session and confirm it disappears from admin, coach, and client session views.

- The implemented backend feature: Booking and roster management

Admins and coaches can assign and unassign clients to sessions. Capacity and private-session replacement rules are enforced by backend services.

. As admin, open a session and assign a client to it.
. Refresh `/admin/sessions`, `/admin/schedule`, `/coach/sessions`, and `/client/sessions` to confirm the assignment appears in the right places.
. Try assigning more clients than a group session capacity allows and confirm the backend blocks it.
. Assign a different client to a private session and confirm the previous active private booking is removed or canceled.
. As coach, assign and unassign clients only from sessions owned by that coach.

- The implemented backend feature: Coach attendance

Coaches can mark booked clients as attended or missed. The backend blocks attendance changes for canceled sessions or canceled bookings.

. Log in as coach and open `/coach/sessions`.
. Select a session with booked clients and mark one client as `Attended`.
. Refresh and confirm the client remains marked attended.
. Mark the same client as `Missed` and confirm the attendance timestamp is cleared by `npm run check:backend`.
. Cancel a session as admin, then confirm the coach can no longer update attendance for that canceled session.

- The implemented backend feature: Coach session notes

Coaches can save a real session note for their own sessions. The note is stored as `SessionNote` and reused by coach, admin, and client dashboards.

. Log in as coach and open `/coach/sessions`.
. Select a session, write a coach note, and click `Save note`.
. Refresh `/coach/sessions` and `/coach/schedule` and confirm the note persists.
. Log in as admin and check overview/session/client surfaces that display recent notes.
. Log in as the related client and confirm the session or coach note appears where relevant.

- The implemented backend feature: Subscription and payment management

Admins can create, edit, pause, resume, cancel, and renew subscriptions. Custom price, renewal date, payment status, and payment history are persisted.

. Open `/admin/subscriptions`, create or edit a subscription for a client with a plan, amount, status, payment state, and renewal date.
. Mark a subscription as paid and confirm a payment appears in the payment history.
. Pause, resume, cancel, and renew a subscription, refreshing after each action.
. Confirm `/client/subscription` reflects the updated status, renewal date, amount, benefits, and payment history.
. Run `npm run check:backend` and confirm subscription/payment integrity checks pass.

- The implemented backend feature: Client dashboard data

Client pages now read real database-backed sessions, assigned coach, settings, subscription, and payment history.

. Log in as a client and open `/client`.
. Confirm upcoming sessions, coach snapshot, and subscription snapshot match admin-created data.
. Open `/client/sessions` and confirm only active or completed relevant sessions appear.
. Open `/client/coach` and confirm the assigned coach is derived from sessions or group assignment.
. Open `/client/subscription` and confirm payment history is shown.

- The implemented backend feature: Client settings and password change

Clients can update profile details, preferences, and their own password. Settings persist through `ClientPreferences`.

. Log in as a client and open `/client/settings`.
. Change full name, email, phone, goal, preferred session time, and notification preferences.
. Save, refresh, and confirm the values persist.
. Change the account password using the security panel.
. Log out and confirm the new password works and the old password fails.

- The implemented backend feature: Coach settings and password change

Coaches can update core profile fields and their own password. Non-persisted notification switches are read-only so the UI does not fake backend saves.

. Log in as a coach and open `/coach/settings`.
. Change full name, email, phone, or specialization.
. Save, refresh, and confirm values persist.
. Change the account password using the security panel.
. Confirm read-only alert switches do not pretend to save notification settings.

- The implemented backend feature: Admin settings, profile, and password change

Admin studio settings persist through `StudioSettings`. Admin profile name/email and own-password change also persist.

. Log in as admin and open `/admin/settings`.
. Change studio name, support info, session defaults, booking settings, or notification defaults.
. Save, refresh, and confirm values persist.
. Open `/admin/profile`, change admin name or email, save, and confirm persistence after refresh.
. Change the admin password using the security panel and confirm login works with the new password.

- The implemented backend feature: Database integrity smoke checks

The project includes a backend smoke-check script that validates important database rules for accounts, sessions, bookings, subscriptions, payments, settings, leads, and notes.

. Run `npm run check:backend`.
. Confirm every line prints `ok`.
. If a check fails, fix the named data or backend flow before continuing manual testing.

- The implemented backend feature: Prisma runtime cleanup

Former Prisma raw-SQL workarounds were replaced with typed Prisma reads and writes. This keeps settings, preferences, coach specialization, client status, custom subscription price, and lead capture aligned with the generated Prisma client.

. Run `npx tsc --noEmit` and confirm no Prisma type errors.
. Save admin settings, client settings, coach settings, client edits, coach edits, and subscription edits.
. Refresh each page and confirm all saved values persist.

- The implemented backend feature: Next dev/build stability

Next/Turbopack is configured to use the actual app folder as root, so Tailwind resolves from the correct `node_modules` folder. Build, lint, and type checks are clean.

. Run `npm run dev` and open `http://localhost:3000`.
. Confirm the homepage compiles without the old Tailwind resolution error.
. Run `npm run build` and confirm the production build completes successfully.
