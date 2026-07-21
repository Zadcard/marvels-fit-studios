# Unified Categories and Groups

## Goal

Make Training Categories the single entry point for managing scheduled groups. A category owns many groups and may have zero or more supervisors selected from existing coaches. Supervisors have full operational read/write access to assigned categories without gaining authority over unrelated categories.

## Experience

- `/admin/categories` lists every category and opens a selected category as a detailed workspace.
- The selected category is stored in the URL so refresh and browser navigation preserve context.
- The category detail shows supervisors, qualified coaches, groups, members, and schedule summaries.
- Group creation happens inside the selected category and includes coach assignment, client membership, and the existing recurring-series editor.
- Admins manage category lifecycle and supervisor assignments.
- `/admin/groups` redirects to the combined Categories page and the separate Groups navigation item is removed.
- `/coach/categories` shows only categories supervised by the signed-in coach and reuses the operational category detail.

## Permissions

- Admins can create, edit, activate, archive, and safely delete categories; assign supervisors; and manage every group.
- Supervisors can edit category details and fully manage groups, clients, coaches, and recurring schedules inside assigned categories.
- Supervisors cannot create, archive, delete, or assign supervisors to categories.
- Every write resolves the affected category server-side. Moving a group between categories requires access to both the source and destination.

## Data model

Add a `CategorySupervisor` join table with a composite primary key of `categoryId` and `coachId`, foreign keys to `TrainingCategory` and `Coach`, timestamps, indexes, RLS, and protected grants. Existing category, group, coach qualification, client membership, and recurring-session data remain unchanged.

## Architecture

The server page loads a combined repository projection containing category summaries, supervisors, groups, members, coach options, and client options. A shared permission-aware workspace renders admin and supervisor modes. Existing group save, membership, and recurring-series flows are reused behind category-scoped authorization helpers.

## Validation

Add migration contract tests, repository mapping tests, authorization tests, route/navigation tests, and interaction coverage for category selection, supervisor assignment, group creation, membership, and recurring schedules. Run typecheck, lint, the full test suite, production build, and authenticated route checks.
