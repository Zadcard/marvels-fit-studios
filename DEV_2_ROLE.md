# Developer 2 Role

Last updated: 2026-04-04

## Role Summary

Developer 2 owns the **Client/Coach + Product Surface** workstream.

This role is intentionally separated from Developer 1 to reduce merge conflicts.

Developer 2 should mainly work on:

- landing and product-facing UX
- login UX
- client portal
- coach portal
- shared dashboard presentation
- integration of backend contracts into user-facing screens

Developer 2 should avoid editing Developer 1-owned files unless both developers explicitly agree first.

## Main Goal

Turn the product-facing parts of the app into a polished, real user experience on top of the backend contracts provided by Developer 1.

That means:

- strong landing and onboarding UX
- stable login flow UX
- real coach portal
- real client portal
- polished shared dashboard shell
- reliable page states and interactions

## Primary Ownership

Developer 2 owns these folders/files first:

### Marketing and public experience

- [app/page.tsx](C:\Users\DELL\Desktop\marvels-fit-studios\marvels-fit-studios\app\page.tsx)
- [app/landing.css](C:\Users\DELL\Desktop\marvels-fit-studios\marvels-fit-studios\app\landing.css)
- [components/landing/landing-interactions.tsx](C:\Users\DELL\Desktop\marvels-fit-studios\marvels-fit-studios\components\landing\landing-interactions.tsx)
- [components/landing/landing-sections.tsx](C:\Users\DELL\Desktop\marvels-fit-studios\marvels-fit-studios\components\landing\landing-sections.tsx)

### Login and session UX

- [app/login/page.tsx](C:\Users\DELL\Desktop\marvels-fit-studios\marvels-fit-studios\app\login\page.tsx)
- [app/login/login.css](C:\Users\DELL\Desktop\marvels-fit-studios\marvels-fit-studios\app\login\login.css)
- [components/providers/session-provider.tsx](C:\Users\DELL\Desktop\marvels-fit-studios\marvels-fit-studios\components\providers\session-provider.tsx)

### Client routes and client screens

- [app\(dashboard)\client\layout.tsx](C:\Users\DELL\Desktop\marvels-fit-studios\marvels-fit-studios\app\(dashboard)\client\layout.tsx)
- [app\(dashboard)\client\page.tsx](C:\Users\DELL\Desktop\marvels-fit-studios\marvels-fit-studios\app\(dashboard)\client\page.tsx)
- [app\(dashboard)\client\coach\page.tsx](C:\Users\DELL\Desktop\marvels-fit-studios\marvels-fit-studios\app\(dashboard)\client\coach\page.tsx)
- [app\(dashboard)\client\sessions\page.tsx](C:\Users\DELL\Desktop\marvels-fit-studios\marvels-fit-studios\app\(dashboard)\client\sessions\page.tsx)
- [app\(dashboard)\client\settings\page.tsx](C:\Users\DELL\Desktop\marvels-fit-studios\marvels-fit-studios\app\(dashboard)\client\settings\page.tsx)
- [app\(dashboard)\client\subscription\page.tsx](C:\Users\DELL\Desktop\marvels-fit-studios\marvels-fit-studios\app\(dashboard)\client\subscription\page.tsx)

### Coach routes and coach screens

- [app\(dashboard)\coach\layout.tsx](C:\Users\DELL\Desktop\marvels-fit-studios\marvels-fit-studios\app\(dashboard)\coach\layout.tsx)
- [app\(dashboard)\coach\page.tsx](C:\Users\DELL\Desktop\marvels-fit-studios\marvels-fit-studios\app\(dashboard)\coach\page.tsx)
- [app\(dashboard)\coach\clients\page.tsx](C:\Users\DELL\Desktop\marvels-fit-studios\marvels-fit-studios\app\(dashboard)\coach\clients\page.tsx)
- [app\(dashboard)\coach\schedule\page.tsx](C:\Users\DELL\Desktop\marvels-fit-studios\marvels-fit-studios\app\(dashboard)\coach\schedule\page.tsx)
- [app\(dashboard)\coach\sessions\page.tsx](C:\Users\DELL\Desktop\marvels-fit-studios\marvels-fit-studios\app\(dashboard)\coach\sessions\page.tsx)
- [app\(dashboard)\coach\settings\page.tsx](C:\Users\DELL\Desktop\marvels-fit-studios\marvels-fit-studios\app\(dashboard)\coach\settings\page.tsx)

### Client components

- [components/dashboard/client-coach-workspace.tsx](C:\Users\DELL\Desktop\marvels-fit-studios\marvels-fit-studios\components\dashboard\client-coach-workspace.tsx)
- [components/dashboard/client-overview-workspace.tsx](C:\Users\DELL\Desktop\marvels-fit-studios\marvels-fit-studios\components\dashboard\client-overview-workspace.tsx)
- [components/dashboard/client-sessions-workspace.tsx](C:\Users\DELL\Desktop\marvels-fit-studios\marvels-fit-studios\components\dashboard\client-sessions-workspace.tsx)
- [components/dashboard/client-settings-workspace.tsx](C:\Users\DELL\Desktop\marvels-fit-studios\marvels-fit-studios\components\dashboard\client-settings-workspace.tsx)
- [components/dashboard/client-subscription-workspace.tsx](C:\Users\DELL\Desktop\marvels-fit-studios\marvels-fit-studios\components\dashboard\client-subscription-workspace.tsx)

### Coach components

- [components/dashboard/coach-clients-workspace.tsx](C:\Users\DELL\Desktop\marvels-fit-studios\marvels-fit-studios\components\dashboard\coach-clients-workspace.tsx)
- [components/dashboard/coach-overview-workspace.tsx](C:\Users\DELL\Desktop\marvels-fit-studios\marvels-fit-studios\components\dashboard\coach-overview-workspace.tsx)
- [components/dashboard/coach-schedule-workspace.tsx](C:\Users\DELL\Desktop\marvels-fit-studios\marvels-fit-studios\components\dashboard\coach-schedule-workspace.tsx)
- [components/dashboard/coach-sessions-workspace.tsx](C:\Users\DELL\Desktop\marvels-fit-studios\marvels-fit-studios\components\dashboard\coach-sessions-workspace.tsx)
- [components/dashboard/coach-settings-workspace.tsx](C:\Users\DELL\Desktop\marvels-fit-studios\marvels-fit-studios\components\dashboard\coach-settings-workspace.tsx)

### Shared UI and dashboard shell presentation

- [app/layout.tsx](C:\Users\DELL\Desktop\marvels-fit-studios\marvels-fit-studios\app\layout.tsx)
- [app/globals.css](C:\Users\DELL\Desktop\marvels-fit-studios\marvels-fit-studios\app\globals.css)
- [app\(dashboard)\layout.tsx](C:\Users\DELL\Desktop\marvels-fit-studios\marvels-fit-studios\app\(dashboard)\layout.tsx)
- [app\(dashboard)\dashboard-shell.css](C:\Users\DELL\Desktop\marvels-fit-studios\marvels-fit-studios\app\(dashboard)\dashboard-shell.css)
- [components/dashboard/dashboard-role-shell.tsx](C:\Users\DELL\Desktop\marvels-fit-studios\marvels-fit-studios\components\dashboard\dashboard-role-shell.tsx)
- [components/dashboard/dashboard-sidebar.tsx](C:\Users\DELL\Desktop\marvels-fit-studios\marvels-fit-studios\components\dashboard\dashboard-sidebar.tsx)
- [components/dashboard/dashboard-topbar.tsx](C:\Users\DELL\Desktop\marvels-fit-studios\marvels-fit-studios\components\dashboard\dashboard-topbar.tsx)
- [components/dashboard/dashboard-modal.tsx](C:\Users\DELL\Desktop\marvels-fit-studios\marvels-fit-studios\components\dashboard\dashboard-modal.tsx)
- [components/dashboard/dashboard-management-toolbar.tsx](C:\Users\DELL\Desktop\marvels-fit-studios\marvels-fit-studios\components\dashboard\dashboard-management-toolbar.tsx)
- [components/dashboard/dashboard-form-section.tsx](C:\Users\DELL\Desktop\marvels-fit-studios\marvels-fit-studios\components\dashboard\dashboard-form-section.tsx)
- [components/dashboard/dashboard-switch.tsx](C:\Users\DELL\Desktop\marvels-fit-studios\marvels-fit-studios\components\dashboard\dashboard-switch.tsx)
- [components/dashboard/dashboard-stat-card.tsx](C:\Users\DELL\Desktop\marvels-fit-studios\marvels-fit-studios\components\dashboard\dashboard-stat-card.tsx)
- [components/dashboard/dashboard-status-badge.tsx](C:\Users\DELL\Desktop\marvels-fit-studios\marvels-fit-studios\components\dashboard\dashboard-status-badge.tsx)
- [components/dashboard/dashboard-page-header.tsx](C:\Users\DELL\Desktop\marvels-fit-studios\marvels-fit-studios\components\dashboard\dashboard-page-header.tsx)
- [components/dashboard/dashboard-empty-state.tsx](C:\Users\DELL\Desktop\marvels-fit-studios\marvels-fit-studios\components\dashboard\dashboard-empty-state.tsx)
- [components/dashboard/dashboard-activity-feed.tsx](C:\Users\DELL\Desktop\marvels-fit-studios\marvels-fit-studios\components\dashboard\dashboard-activity-feed.tsx)
- [lib/navigation/dashboard-nav.ts](C:\Users\DELL\Desktop\marvels-fit-studios\marvels-fit-studios\lib\navigation\dashboard-nav.ts)

## Secondary Ownership

Developer 2 may edit these shared files only when necessary:

- shared form wiring files under future `app/actions/client/*`
- shared DTO consumption files
- shared dashboard abstractions in `lib/dashboard/*`

Rule:

- if Developer 2 must change a contract-sensitive shared file, Developer 1 should review it before merge

## Files Developer 2 Should Avoid

To prevent conflicts, Developer 2 should normally not edit:

- `prisma/**`
- `lib/prisma.ts`
- `auth.ts`
- `auth.config.ts`
- `proxy.ts`
- `lib/auth/**`
- `lib/repositories/admin-*`
- future `lib/dal/**`
- future `lib/services/**`
- future `app/actions/admin/**`
- admin-specific backend contract files

## Milestone Ownership

### Milestone 1: Product stabilization

Developer 2 owns:

- logout UX
- login polish
- page-level error/loading handling
- dashboard shell polish

### Milestone 2: Admin integration support

Developer 2 owns:

- consuming Developer 1 admin actions in screens if UI help is needed
- but without taking ownership of admin backend contracts

### Milestone 3: Coach and client portal wiring

Developer 2 owns:

- replacing client/coach portal mocks with real data bindings
- keeping those screens polished and consistent

### Milestone 4: Session UX

Developer 2 owns:

- client booking UX
- coach attendance/session UX
- schedule page interaction quality

### Milestone 5: Subscription UX

Developer 2 owns:

- client subscription experience
- payment visibility experience
- coach/client state messaging

### Milestone 6: Supporting flows

Developer 2 owns:

- landing contact form UX
- notes/file UI behavior
- profile/settings UX

### Milestone 7: Launch readiness

Developer 2 owns:

- responsive QA
- interaction QA
- smoke testing by role
- visual regression review

## Definition of Done for Developer 2

Developer 2 is done only when:

- client and coach portals use real backend data
- landing/login/dashboard UX are polished
- shared dashboard shell is stable
- loading/error/empty states are complete
- the product feels ready to use end-to-end

## Working Rules

Developer 2 should:

- wire UI against existing contracts instead of inventing backend logic
- keep shared shell changes isolated
- avoid mixing marketing/client/coach changes with admin backend changes in one PR
- keep PRs user-flow focused

## Final Mission

Developer 2 takes the project from:

- beautiful but mostly mock-driven product surfaces

to:

- fully wired, polished client-facing and coach-facing experience
- production-ready product usability

This role owns the user-facing delivery quality of the product until the absolute end of the project.
