# Linked Programs and Shared Forms

## Product model

The navigation label becomes **Programs**. A program is the user-facing workspace that combines one active training category with its scheduled groups. The database remains explicit: `TrainingCategory` is the program type and `Group` is the cohort. The Programs page keeps the master-detail relationship, but removes duplicate framing and heavy summary blocks. A compact category list selects a simple group workspace; status, supervisors, and category actions stay close to the selected program.

Every operational selector must read from the same live entities. Active category selectors query `TrainingCategory.isActive = true`; active group selectors query `Group.isActive = true` and include the group category relation. Archived records remain visible only where admins manage historical records or edit an existing referenced record.

## Category and group data flow

`Lead` and `Client` gain nullable `categoryId` foreign keys. Existing rows are backfilled only through exact `legacyValue` matches or their already-linked group category. The legacy enum fields remain temporarily for compatibility, but new writes use the relational IDs as the source of truth. Selecting a group also synchronizes the corresponding category.

Lead intake receives live active categories. Trial booking and subscription receive category-aware active groups and show only groups belonging to the lead's selected category. Server actions recheck category activity, group activity, and group/category consistency so stale browser data cannot create an invalid assignment. Client create/edit uses the same dependent category then group selection. Schedule and recurring-session selectors expose active groups only, while existing inactive links may still render as historical data.

## Shared form language

The existing Add Member dialog becomes the single form language through `EntityDialog`, `EntityForm`, `FormField`, `FormActions`, and `ConfirmDeleteDialog`. Category, supervisor, group, member assignment, lead intake, trial booking, subscription conversion, lost reason, cash-in, cash-out, schedule, and recurring-series forms use the same centered canvas, 20px radius, spacing grid, labels, controls, close button, error banner, and action row. Drawers, receipts, and the command palette remain specialized because they are viewers or navigation, not data-entry forms.

All dialogs retain keyboard focus management through Radix, visible focus states, disabled pending actions, accessible labels, and responsive one-column layouts below 700px.

## Cash and Today

Cash-in offers two sources: Client and Other. Client income continues to create `Payment` rows, preserving subscription ledger and receipt behavior. Other income is written to a new `StudioIncome` table with a required source label, amount, method, date, and optional note. Reports and Today's cash totals combine client payments and studio income without pretending a non-client payment belongs to a member.

The Today page keeps the cash summary and report link but removes the cash-out action from that page. Cash-out remains available in Reports, where financial controls belong.

## Validation

Contract tests cover active-source queries, relational backfill, dependent lead/group selection, server-side consistency checks, generic income reporting, the shared dialog primitives, and the Today-page removal. Validation includes linked migration dry-run and push, generated Supabase types, typecheck, lint, full tests, production build, and browser checks on Programs, Leads, Clients, Schedule, Reports, Subscriptions, and Today at desktop and mobile widths.
