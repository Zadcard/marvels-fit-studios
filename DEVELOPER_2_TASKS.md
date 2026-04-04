# Developer 2 Tasks

Last updated: 2026-04-04

This file is the practical task list for Developer 2.

Developer 2 works on the **Client/Coach + Product Surface** side of the project.

Important rule:

- Developer 2 should stay away from Developer 1 files unless both developers finish and agree to merge shared changes later.

## Main Working Area

Developer 2 should work only in these areas first:

- `app/page.tsx`
- `app/landing.css`
- `components/landing/*`
- `app/login/*`
- `components/providers/session-provider.tsx`
- `app/(dashboard)/client/*`
- `app/(dashboard)/coach/*`
- `components/dashboard/client-*`
- `components/dashboard/coach-*`
- shared UI-only dashboard components

## Do Not Touch

Developer 2 should not work in these areas during parallel execution:

- `prisma/*`
- `lib/prisma.ts`
- `auth.ts`
- `auth.config.ts`
- `proxy.ts`
- `lib/auth/*`
- `lib/repositories/admin-*`
- future `lib/dal/*`
- future `lib/services/*`
- future `lib/validators/*`
- future `app/actions/admin/*`
- `app/(dashboard)/admin/*`
- `components/dashboard/admin-*`

Avoid shared files too unless absolutely necessary:

- `components/dashboard/dashboard-role-shell.tsx`
- `components/dashboard/dashboard-sidebar.tsx`
- `components/dashboard/dashboard-topbar.tsx`
- `lib/navigation/dashboard-nav.ts`

## Phase 1 Tasks: Product Surface Stabilization

- Improve login UX.
- Add logout UX in the dashboard surface.
- Improve loading and error states in user-facing flows.
- Review landing page clarity and structure.
- Keep the public-facing experience polished while backend work happens separately.

## Phase 2 Tasks: Landing and Login

- Finalize landing page structure and polish.
- Prepare the contact/join flow UI for later backend integration.
- Finalize login form experience.
- Improve login validation messages and UX if needed.
- Keep login page ready to consume the final auth behavior from Developer 1.

## Phase 3 Tasks: Client Portal UI

- Refine client dashboard layout.
- Refine client sessions page UI.
- Refine client coach page UI.
- Refine client settings page UI.
- Refine client subscription page UI.
- Prepare client screens to consume real backend data later.
- Remove UI assumptions that depend too heavily on mocks.

## Phase 4 Tasks: Coach Portal UI

- Refine coach dashboard layout.
- Refine coach clients page UI.
- Refine coach schedule page UI.
- Refine coach sessions page UI.
- Refine coach settings page UI.
- Prepare coach screens to consume real backend data later.

## Phase 5 Tasks: Shared Dashboard Surface

- Improve dashboard shell UX if needed.
- Improve modal UX.
- Improve toolbar/filter UX.
- Improve empty/loading/error states.
- Improve responsive behavior for client and coach portals.

Important:

- if a shared file must be changed, keep it small and isolated
- try to postpone shared-file edits until both developers are ready to merge

## Phase 6 Tasks: Client and Coach Integration

- Wire client portal screens to real backend contracts after Developer 1 finishes them.
- Wire coach portal screens to real backend contracts after Developer 1 finishes them.
- Add proper success/error/loading behavior to those integrations.
- Make sure the UI handles empty real data correctly.

## Phase 7 Tasks: Contact, Notes, and Files UX

- Connect landing page contact form UI to the future backend contract.
- Add user-friendly UX for notes and files once backend endpoints exist.
- Add clear user-facing messages for submission success/failure.

## Phase 8 Tasks: QA and Product Polish

- Test client flows locally.
- Test coach flows locally.
- Test dashboard responsiveness.
- Test loading/error/empty states.
- Fix visual inconsistencies.
- Fix interaction issues.
- Run role-by-role manual product checks.

## End Goal for Developer 2

Developer 2 is finished when:

- landing page is polished
- login UX is polished
- client portal is polished and wired
- coach portal is polished and wired
- all user-facing flows feel complete and consistent

## Parallel Safety Rule

If Developer 2 follows this file correctly, most of the work will stay separate from Developer 1 because Developer 2 is focused on:

- landing
- login UX
- client portal
- coach portal
- shared presentation

That keeps Developer 2 away from:

- schema
- auth backend internals
- admin backend
- core domain logic
