# Marvel Fit Studios Light Frontend Redesign

## Outcome

Replace every existing public, authentication, admin, coach, and client interface with the warm light system defined by the Claude Design handoff while preserving routes, role checks, repositories, server actions, Supabase access, analytics hooks, and feature behavior.

## Source of truth

- `Marvel frontend redesign-handoff/marvel-frontend-redesign/project/Design Language.dc.html`
- `Marvel frontend redesign-handoff/marvel-frontend-redesign/project/Admin Overview.dc.html`

The prototype is a visual specification, not production code. Production screens must use real repository data, existing actions, responsive layouts, accessible interactions, and explicit loading, empty, error, and destructive states.

## Architecture

The frontend keeps the current server boundary:

1. App Router page and role layout
2. Server-only repository for reads
3. Serializable view data passed to the workspace
4. Existing server actions and services for writes
5. Supabase remains behind server-only modules

The redesign may add presentation-only view models but does not change the database schema or authentication model.

## Phases

1. Preserve the older dark redesign on a recovery branch and establish a clean light-redesign branch.
2. Build the exact light tokens, fonts, primitives, responsive rules, and contract preview.
3. Replace the shared role-aware dashboard shell.
4. Rebuild Admin Overview from the handoff using real data.
5. Redesign remaining admin operational screens.
6. Redesign coach screens, including Transformation Studio.
7. Redesign client screens.
8. Redesign landing, join, login, password, and global error surfaces.
9. Remove obsolete design layers and perform full responsive, accessibility, integration, build, and browser verification.

## Design rules

- Warm neutrals only; no cold-gray or dark-theme remnants.
- Marvel red is reserved for brand, the active navigation item, live data, and one primary action per view.
- Emerald, amber, orange, and critical red communicate status rather than decoration.
- Space Grotesk owns headings and numeric values; Manrope owns body and interface copy.
- Production layouts reflow at mobile and tablet widths and never scale the whole desktop canvas.
- All icon-only controls have accessible names and at least 44 by 44 pixel touch targets.
- Destructive operations use an accessible confirmation dialog.
- Loading states reserve layout space; empty states provide one clear next action.
- Motion is limited to short transform or opacity feedback and respects reduced-motion preferences.

## Verification gates

- Exact token and typography contract tests
- Route, role, server-action, and analytics preservation scans
- Lint, generated route types, TypeScript, Vitest, and production build
- Role-based browser flows and mutation checks
- Responsive checks at 375, 768, 1024, and 1440 pixels
- Keyboard, focus, dialog, contrast, reduced-motion, loading, empty, and error-state checks
- Final scan proving obsolete dark and legacy visual layers are gone
