# Transformation Studio Roadmap Design

## Product direction

Marvel's Fit Studios is a coach-led transformation studio platform, not a generic gym ERP. The primary product loop is:

`Lead -> Assessment -> Goal -> Program -> Session delivery -> Progress review -> Renewal`

Admin screens prioritize operational exceptions. Coach screens prioritize today's delivery and clients needing adjustment. Client screens prioritize the next action, current plan, and visible evidence of progress.

## Architecture

Next.js App Router remains the server-rendered application and backend-for-frontend. Auth.js credentials sessions identify a user, while every protected read and mutation revalidates the persisted Supabase user and role. Supabase remains the only database and file platform. Application tables use RLS with server-only service-role access; server actions enforce the domain authorization boundary before querying or mutating data.

The transformation domain adds assessments, goals, exercises, programs, prescribed workouts, workout logs, progress metrics, and member check-ins. Records reference existing Client, Coach, User, and TrainingSession rows instead of duplicating identity or scheduling data.

## Data flow and errors

Coaches open a member transformation workspace, record an assessment, define goals, assign a program, prescribe exercises, log delivered work, record measurements, and respond to check-ins. Clients read the active plan and progress timeline and submit check-ins. Admins can inspect the same outcome summary without editing coaching prescriptions.

Validation happens with Zod before server mutations. Authorization failures fail closed. Database failures reach route error boundaries rather than rendering empty data. Multi-record program saves use transactional Postgres functions. File assets use the private `coach-files` Storage bucket and database metadata only.

## Verification

Each phase requires lint, TypeScript, unit tests, and migration alignment. Database workflows receive remote smoke verification with synthetic records removed afterward. Browser tests cover lead conversion, role boundaries, session delivery, progress recording, and client check-ins before the roadmap is considered complete.
