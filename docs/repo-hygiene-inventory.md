# Repo Hygiene Inventory — 2026-07-18

Read-only survey for audit §9 (Dead Code / Repo Hygiene). Nothing was moved or deleted.

## Important: this is already being worked on

`.claude/worktrees/repo-hygiene/` is a live git worktree with its own `.git`, and it contains a `.codex/config.toml` — this is a **Codex session's checkout**, on a branch presumably named `repo-hygiene`. It already shows the exact §9.4 cleanup in progress: the root-level design mockup has been copied to `docs/archived/design-handoff/marvel-ops-design-bundle/` inside that worktree, with the nested `design_handoff_marvel_ops/` folder flattened alongside a `README.md` explaining the archive.

**Do not move or delete anything below** — it's mid-relocation in another session. This inventory is for awareness only.

## Current root-level state (as found)

| Item | Status | Note |
|---|---|---|
| `Marvel Ops.html` (root) | Present, ~700 KB per audit | Being relocated in the `repo-hygiene` worktree to `docs/archived/design-handoff/Marvel Ops.html` |
| `Marvel Fitness Studios operations system/` (root) | Present, contains `Marvel Ops.dc.html`, `design_handoff_marvel_ops/` (nested dupe of the same file + `support.js` + `assets/logo.png` + its own `README.md`), and a `.thumbnail` file | Being relocated to `docs/archived/design-handoff/marvel-ops-design-bundle/` |
| `output/`, `playwright-report/`, `test-results/` | **Not present at root right now** | `.gitignore` already covers all three (`playwright-report/`, `test-results/`, `output/`). Audit's "tracked or lying around" claim may already be stale, or these only appear after a local test run and get cleaned. Can't confirm git-tracked status without a shell this session — if they were ever committed before the ignore rule was added, `git rm -r --cached <dir>` is still needed even though the working tree is clean now. |
| `tsconfig.tsbuildinfo` (root) | Present | Already covered by `.gitignore`'s `*.tsbuildinfo`. Same caveat as above — check it's not still tracked from before the ignore rule existed. |
| `.claude/skills/` missing dirs (`browser-use`, `frontend-design`) | Not independently re-verified | Audit flagged these as referenced-but-missing, causing git warnings. `.claude/` itself is explicitly out of scope per `docs/WHERE_TO_EDIT.md`'s "What to ignore first" — worth a `git grep` for the references before removing them. |
| Last commit message `///` (commit `144b3b79`) | Not verified this session | No shell access this session to run `git log`; take the audit's word for it or check with `git show 144b3b79 --stat` when you have a terminal. |
| `scripts/promote-leads-to-clients.cjs` | Present, `promote:leads` npm script wired to it | References the pre-kanban leads flow per audit; not independently re-verified against current `admin-lead-repository.ts` schema this pass. |
| `prisma/` | Contains only `migrations/`, no Prisma dependency in `package.json` | Confirmed — `package.json` has no `prisma`/`@prisma/client` package. `docs/WHERE_TO_EDIT.md` has been corrected to point database changes at `supabase/migrations/` instead. |

## Net effect

Of the audit's ten §9 hygiene items, one (design artifacts) is actively being handled by a concurrent Codex worktree right now, two (tracked generated output) may already be resolved or need a `git rm --cached` check rather than a working-tree change, and the rest weren't re-verified this pass since they need `git log`/`git grep` output this session couldn't produce (no shell). Recommend checking in with whoever owns the `repo-hygiene` branch before starting any hygiene work yourself, so you don't duplicate or conflict with it.
