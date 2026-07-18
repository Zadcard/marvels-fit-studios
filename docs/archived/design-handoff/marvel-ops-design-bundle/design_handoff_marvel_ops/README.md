# Handoff: Marvel Fitness Studios — Operations System

## Overview
An internal operations app for **Marvel Fitness Studios** (single-location studio, 6th of October City, Egypt). It replaces the current Excel + WhatsApp + memory workflow with one calm, fast, operations-first tool for **two roles**: Admin (runs the studio) and Coach (needs only their day). Every screen answers one operational question — who's coming today, who missed, whose subscription expires, which coach is free, where the money went.

## About the Design Files
The files in this bundle are **design references created in HTML** — a working prototype that shows the intended look, layout, copy, and interactions. **They are not production code to copy directly.** `Marvel Ops.dc.html` is authored in a proprietary "Design Component" format (a custom `<x-dc>` template + a `DCLogic` class, run by `support.js`); do not ship that runtime.

**Your task:** recreate these designs in the target codebase's existing environment using its established patterns and libraries. If the current frontend is React, build these as React components/routes; if Vue, Vue; etc. If no frontend exists yet, choose the most appropriate modern framework (React + a router + a component library, or similar) and implement there. Lift the exact visual values (below) into that stack. After the initial recreation, further features can be added directly from the codebase on request.

To view the reference: open `Marvel Ops.dc.html` in a browser (it self-loads `support.js`).

## Fidelity
**High-fidelity.** Final colors, typography, spacing, and interactions. Recreate the UI pixel-closely using the codebase's own libraries. Exact tokens are listed in **Design Tokens**.

## Information Architecture
Left sidebar with a **role switch** (Admin / Coach) at the top; the nav list changes per role.

**Admin nav** (grouped):
- **Operations** — Today, Attendance, Schedule
- **People** — Leads & Trials, Clients, Groups, Coaches
- **Money** — Subscriptions

**Coach nav** — Today (my sessions), On my phone (a mobile mock of the coach view).

Top bar: breadcrumb + page title (left), a "/" search field (visual placeholder — not yet wired; a good candidate for a command palette), and a live clock pill (right).

## Screens / Views

### 1. Today (Admin — flagship)
- **Purpose:** the daily command center. Answers "what's happening on the floor right now."
- **Layout:** vertical stack, max-width 1180px, 28px padding.
  - **Metric strip** — one bordered rounded card split into 5 equal cells (divided by 1px lines): *On floor now* (live count + names), *Coming today* (session count + clients expected), *Trials today* (count), *Renew this week* (count + value at stake), *Cash today* (net + payment count). Big numbers use the display/stencil font.
  - **Two-column masonry** (`grid-template-columns: 1.55fr 1fr`, `align-items:start`, 20px gap). **Left column:** "Today's floor" (list of sessions: time/duration, category + type badge + Live badge, coach avatar+name, present/total + progress bar; live row has a red left-border + tinted bg; done rows dimmed; click a row → Attendance for that session) **then** "Who's busy right now" (per-coach status: On floor / Free / Break / Later / Off). **Right column:** "Trials today" (convert/follow-up), "Renew this week" (remind), "Cash today" (cash-in/out + method split + "Record cash out" button).
- **Note:** the left/right columns are separate stacks so heights balance (no vertical gap between the floor list and "Who's busy").

### 2. Attendance (Admin)
- **Purpose:** mark check-ins extremely fast — one tap per client.
- **Layout:** row of session chips (time + category + present/total) to pick the session; selected session shows a big header (category, type, coach, time, present/total counter, **"Mark all in"** button).
- **Roster rows:** 44px status square on the left (empty dashed → tap turns it to a green ✓ / L late), name + injury badge + Trial badge, meta line. On the right, three exception buttons: **✕ Absent**, **L Late**, **N No-show** (toggle; active = filled color). Tapping the row body = present. Footer shows tallies (in / absent / late / pending) + "Send summary to coach."
- **Interaction:** clicking the row sets present; the small buttons `stopPropagation` and set their state. Re-tapping the same state clears to none.

### 3. Schedule (Admin)
- **Purpose:** the recurring weekly template + change requests.
- **Layout:** `grid-template-columns: 1fr 320px`. Left: a week grid (56px time gutter + 7 day columns, Sat-first). Each cell is a category block with a colored left border, category name, coach first-name; today's column tinted; live cell has a blinking dot. Right: "Change requests" queue — each shows client, reason, a **kind badge distinguishing One session vs Recurring**, the detail, and Approve/Decline.

### 4. Leads & Trials (Admin)
- **Purpose:** follow-up pipeline. **The lead only chooses a category; the admin assigns them into a group + trial slot.**
- **Layout:** a row of source counters (WhatsApp / Instagram / Call / On-ground) + "Add lead" button, then a **5-column kanban**: New → Trial booked → Trial done → Won → Lost.
- **Card:** avatar, name, note, source badge, a **"Wants: <category>"** line, injury line (if any), an assigned-slot chip (only on Trial-booked: "Ladies Class · today 9:00 AM"), phone, and a **stage action button** ("Assign to group" / "Mark trial done" / "Subscribe"; none on Won/Lost).

### 5. Groups (Admin)
- **Purpose:** the permanent recurring classes.
- **Layout:** 2-column cards. Each: group name, recurring days, a 2-cell stat row (**Time**, **Category** — location and spots were intentionally removed, single location), coach avatar+name, members/capacity + fill bar, "Full" badge when at capacity.

### 6. Coaches (Admin)
- **Purpose:** load and free time to organize session timing.
- **Layout:** 2-column cards. Each: avatar, name, role · categories, free-time + today status (right), a **timeline bar row** (per-hour blocks; busy = red gradient, free = surface), stats (sessions/week, clients), and a weekly-load bar (green/amber/red by %).

### 7. Subscriptions (Admin)
- **Purpose:** renewals, remaining sessions, and cash flow.
- **Layout:** 4 summary tiles (Active / Expiring 7d / Expired / Renewed), then a **full-width "Members & renewals" table**, then a **3-column row**: Cash flow · February (cash in/out/net + by-method bars), Cash out (expense list + "+ Record"), Recent income.
- **Table columns:** `1.4fr .9fr 1fr .8fr .9fr auto` — Member (avatar, name, status pill), Plan (+ amount), **Sessions left** (remaining/bundle with mini bar; bundles are 8/12/16/20; color: green / amber ≤2 / red 0), Method badge (InstaPay/Visa/Cash), Renews (relative + date), CTA (Renew / Reactivate / Receipt). **All grid cells need `min-width:0`** so columns shrink correctly.

### 8. Client Profile Drawer (Admin)
- **Purpose:** retrieve everything about a client instantly. Opens as a **440px right-side drawer** when a client row (Clients view) is clicked.
- **Sections:** header (avatar, name, status, category/type; Renew / WhatsApp / Change-schedule actions); **injury banner at top** (amber, "always visible to coach"); stats (Sessions left w/ bar, Attendance % + streak); details list (phone, coach, recurring schedule, plan, member-since); **recent-activity timeline** (dotted vertical line, newest first with a red dot).

### 9. Cash-out Modal (Admin)
- Centered modal. **Reason** chips (Salaries, Studio needs, Supplies, Rent & bills, Maintenance, Other), **For whom/what** text, **Amount (EGP)**, **Paid via** (InstaPay/Visa/Cash). Cancel / Record expense.

### 10. New-member / Lead Intake Modal (Admin)
- Centered modal, sticky header + footer. **Switch: New member / Lead.** Fields: name, phone, **preferred class** chips (7 categories). **Lead mode** adds a source picker and the subtitle "admin books the trial later"; CTA becomes "Save lead." **Injury toggle** expands an amber field. Notes textarea. CTA "Register member" / "Save lead."

### 11. Coach — Today
- Greeting header (avatar, name, role, weekly/clients stats), "My sessions today" (each session with time, category, Live badge, present/total, "Mark attendance" button, and a wrapping roster of member chips with injury ⚠), "Injuries to watch" panel, "Schedule changes" panel.

### 12. Coach — On my phone
- A 340×720 phone mock (notch, bottom tab bar Today/Week/Clients) rendering the coach's day: next/live session card with a "Mark attendance" button, injuries-to-watch list. Beside it, explanatory copy ("Everything a coach needs — nothing they don't").

## Interactions & Behavior
- **Role switch** toggles the whole nav + content between Admin and Coach.
- **Nav** sets the active view; active item has a red left-border + gradient tint.
- **Attendance:** tap row = present; ✕/L/N toggle exception states; "Mark all in" fills all pending as present. Counts recompute live.
- **Clicking a today-floor row or session chip** navigates to Attendance with that session selected.
- **Clicking a client row** opens the profile drawer; overlay click or ✕ closes it.
- **Modals** (cash-out, intake) open from their buttons; overlay/✕/Cancel close; inner clicks `stopPropagation`.
- **Live indicators:** pulsing red dot on the clock pill and blinking "Live" badges (CSS `@keyframes mvpulse`, `mvblink`).
- Hover states throughout: subtle bg lift on rows/nav, brightness on primary buttons, border lighten on secondary.

## State Management
- `role` ('admin' | 'coach'), `view` (today/attendance/schedule/leads/clients/groups/coaches/subs), `coachView` (today/phone).
- `selSession` (selected session id for Attendance).
- `att` — map of `{ sessionId: { clientId: 'present'|'late'|'absent'|'noshow'|'none' } }`. Seeded for done/live sessions on mount.
- `profileName` (open client drawer or null).
- `cashOutOpen`, `coCat`, `coMethod` (cash-out modal).
- `intakeOpen`, `inKind` ('client'|'lead'), `inCat`, `inSource`, `inHasInjury` (intake modal).
- Data (coaches, sessions+rosters, trials, renewals, subs, leads, groups, clients+profiles) is currently hard-coded mock data in the logic class — replace with real API/data fetching. In the prototype nothing persists to a backend; the submit buttons just close their modal.

## Design Tokens
Colors (hex / rgba):
- Backgrounds: `--bg #050505`, `--bg2 #0a0a0a`, `--surface #111111`, `--surface2 #171717`, `--surface3 #1c1c1c`
- Lines: `--line #2a2a2a`, `--line2 #3a3a3a`, `--line3 #4a4a4a`
- Brand red (oxblood): `--red #e62429`, `--red2 #ff4f54`, `--red-deep #b91c21`, `--red-soft #2d1011`
- Text: `--text #ffffff`, `--muted #8f8f8f`, `--muted2 #c4c4c4`
- Semantic: success `#25d366`, warn `#f59e0b`, danger `#ef4444`, blue `#3b82f6`, violet `#8b5cf6`, teal `#14b8a6`
- Page background is a dark radial: two faint red radial glows (top-left ~10%, bottom-right ~7%) over `--bg`.
- Avatar gradients: red `#e62429→#ff4f54`, blue `#3b82f6→#8b5cf6`, violet `#8b5cf6→#ec4899`, amber `#f59e0b→#ef4444`, green `#059669→#25d366`, teal `#14b8a6→#3b82f6`.

Typography (Google Fonts):
- Display / headings: **Space Grotesk** (500/600/700), tight letter-spacing (-.02em).
- Body / UI: **Manrope** (400–800).
- Mono (labels, times, phone, small caps): **JetBrains Mono** — uppercase, letter-spacing .1–.2em for eyebrow labels.
- Big stat numerals: **Archivo Black** (`--fs`).

Radius: cards 18px; inputs/buttons 10–12px; pills/badges 5–9px; full-round 99px. Spacing: 20–28px section gaps, 12–22px card padding. Shadows: modals `0 40px 90px rgba(0,0,0,.6)`; primary buttons `0 12px 24px rgba(230,36,41,.28)`.

Layout: sidebar 264px; content max-width 1180px; app designed for ~1280px+ desktop (the coach phone mock is 340×720).

## Assets
- `assets/logo.png` — Marvel logo (rendered white via `filter: brightness(0) invert(1)`). From the project's design system.
- No other image assets; all icons are Unicode glyphs (◎ ✓ ▤ ⚑ ◉ ⬡ ◭ $ etc.) — **replace with your codebase's icon set** (e.g. Lucide/Heroicons) during recreation.
- Fonts load from Google Fonts (see `<link>` in the file head).

## Files
- `Marvel Ops.dc.html` — the full design reference (all screens, styles inline, logic class at the bottom). Read this for exact markup, values, and the mock data shapes.
- `support.js` — the prototype runtime (reference only; do not ship).
- `assets/logo.png` — logo asset.
