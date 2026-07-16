# Marvel Fit REDLINE — Frontend Zero-Rebuild

## Objective

Replace every public, authentication, admin, coach, and client interface with a new product design derived from the supplied dashboard references and the actual Marvel Fit feature set. No visual markup, palette, layout, or screen composition from the previous frontend redesigns is a design source.

## Protected system contracts

- Existing routes and role redirects.
- Authentication, authorization, and password-change enforcement.
- Server actions, repositories, validators, Supabase access, storage, API routes, and cron behavior.
- Domain types and user-visible workflows.
- The Marvel's Fit Studios name, logo family, and red/black/white identity.

## Visual direction

REDLINE uses a light operational canvas inside a decisive black application frame. Red identifies primary actions, active navigation, priority, and brand moments. White and derived neutral shades carry dense operational information. Green, amber, and blue are reserved for semantic states and never become decorative palette colors.

The reference images contribute structural principles only:

- a horizontal product navigation with a compact utility rail;
- modular, asymmetric bento compositions based on information priority;
- schedule-first calendar and timeline views;
- searchable directories with card/table modes and contextual side sheets;
- calm outlines, generous control sizes, and restrained elevation;
- independent mobile compositions rather than scaled desktop screens.

## Foundations

- Display typography: Sora.
- Interface typography: Plus Jakarta Sans.
- Brand red: `#e21d2e`.
- Signal red: `#b90f1d`.
- Ink: `#0b0b0d`.
- Graphite: `#19191c`.
- Canvas: `#f4f3ef`.
- Surface: `#ffffff`.
- Derived neutrals use black/white mixing only.
- Minimum interactive target: 44px.
- Focus is always visible and motion respects reduced-motion preferences.

## Product architecture

### Shared

Application shell, role navigation, global search, notification access, account access, route feedback, empty states, errors, confirmation surfaces, and responsive navigation.

### Admin

Operations overview, clients, coaches, live sessions, weekly/monthly schedule, join requests and leads, subscriptions, billing, recurring templates, bulk import, notifications, profile, and studio settings.

### Coach

Daily overview, assigned sessions, client roster, client transformation records, schedule, notifications, and settings.

### Client

Personal overview, sessions and booking, progress, coach contact, subscription, notifications, and settings.

### Public and auth

Landing, join flow, login, password change, redirect, not-found, and failure states.

## Execution sequence

1. Inventory and remove Claude handoff assets, previews, old palette documents, and overlapping shell layers.
2. Establish REDLINE tokens, typography, primitives, shell, navigation, and responsive behavior.
3. Build the canonical Admin Overview, Clients Directory, and Weekly Schedule screens.
4. Rebuild the remaining admin workflows without copying old visual markup.
5. Rebuild coach and client workflows around their real tasks.
6. Rebuild public/auth surfaces.
7. Connect every screen to the preserved data and mutation contracts.
8. Remove all temporary compatibility CSS and old dashboard components.
9. Verify behavior, accessibility, responsive layouts, build output, and absence of old-design artifacts.

## Completion evidence

- Every route in the route inventory renders a REDLINE screen at 375, 768, 1024, and 1440 widths.
- Backend actions and repositories remain connected and role protections remain enforced.
- No import or text reference points to `Marvel frontend redesign-handoff`, the light redesign plan, old shell styles, or old design-system preview routes.
- No old dashboard visual component remains in the production graph.
- Keyboard navigation, focus visibility, dialog behavior, contrast, and reduced motion are verified.
- Lint, typecheck, unit tests, production build, and representative browser workflows pass.
