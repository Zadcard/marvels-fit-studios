# Marvel's Fit Studios — Frontend Design Handoff

> Purpose: complete inventory of all HTML/CSS/React content currently used by the frontend.
> Give this file to a designer (or another Claude session) as the source of truth for producing
> a new design. Everything visual in the app is listed here: routes, components, stylesheets,
> class names, design tokens, fonts, and assets.

---

## 1. Tech stack (what the new design must fit into)

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, React Server Components) — **breaking changes vs older Next.js; read `node_modules/next/dist/docs/` before coding** |
| UI library | React 18.3 |
| Styling | Tailwind CSS v4 (via `@tailwindcss/postcss`) + **hand-written plain CSS files with BEM-style class names** (most styling lives in the plain CSS, not Tailwind utilities) |
| Animations | `tw-animate-css` + custom keyframes in `globals.css` |
| Icons | `lucide-react` |
| Headless primitives | `radix-ui`, `shadcn` (installed; only a few `components/ui/*` wrappers exist) |
| Class helpers | `clsx`, `class-variance-authority`, `tailwind-merge` |
| Fonts | Google Fonts via `next/font`: **Manrope** (body, weights 400–800, var `--font-body`) and **Space Grotesk** (headings, weights 500/700, var `--font-display`) — defined in `app/fonts.ts` |
| Auth/Data | next-auth v5, Supabase, Prisma (not visual, but pages are server components that fetch data) |
| Tests that touch the UI | Vitest + happy-dom unit tests, Playwright e2e in `e2e/`, plus `tests/dashboard-mini-stat-adoption.test.mjs` (checks design-system adoption). **Renaming class names / aria labels / data attributes can break tests.** |

Brand: **Marvel's Fit Studios** ("Marvel Fit") — premium performance training studio in Giza, Egypt.
Canonical brand constants: `lib/site.ts`. Logo: `/img/Logo-1.png` (also Logo-2, Logo-3 in `public/img/`).

Current visual identity: **near-black backgrounds (#030303), Marvel red brand color (#e62429), white text, pill buttons, large radii (14–30px), soft red radial-gradient glows, uppercase letter-spaced eyebrows/buttons.**

---

## 2. Route map (every page in the app)

### Public / marketing
| Route | File | What it renders |
|---|---|---|
| `/` | `app/page.tsx` + `app/landing.css` | Marketing landing page: skip-link, header/nav, hero (badges, H1, CTA), About section w/ logo panel, Services carousel, Reviews carousel inside `.impact-band`, FAQ accordion (2 columns × 2 items), footer (CTA band, nav columns, socials, locations), Join modal, structured data (JSON-LD) |
| `/login` | `app/login/page.tsx` + `app/login/login.css` (+ `error.tsx`, `loading.tsx`) | Login screen: method tabs, field groups w/ labels + password toggle, inline errors, spinner/loading state, state panels (e.g. success/notice), trust note, back link |
| `/join` | `app/join/page.tsx` + `app/join/join-form.tsx` | Lead-capture join form (public membership request) |
| `/change-password` | `app/change-password/page.tsx` + `change-password-form.tsx` | Forced/first-login password change form |
| `/auth/redirect` | `app/auth/redirect/page.tsx` | Post-auth role-based redirect (minimal UI) |
| 404 | `app/not-found.tsx` | Not-found page |
| Root layout | `app/layout.tsx` + `app/globals.css` + `app/fonts.ts` | `<html>` w/ font variables, AuthProvider, metadata, `themeColor: #111214` |

### Dashboard (route group `app/(dashboard)/`, shared `layout.tsx` + `dashboard-shell.css`)
Three role portals, all using the same shell (sidebar + topbar + content area):

**Admin** (`app/(dashboard)/admin/…` — has own `layout.tsx`, `error.tsx`, `loading.tsx`)
| Route | Page |
|---|---|
| `/admin` | Overview: KPI stat cards, priority/action rows, snapshots, activity feed |
| `/admin/clients` | Client management workspace (roster, filters, detail panel, tables) |
| `/admin/coaches` | Coach management workspace |
| `/admin/leads` | Leads table (approve/convert/delete, WhatsApp message actions) |
| `/admin/join-requests` | Join request review |
| `/admin/sessions` | Session management |
| `/admin/schedule` | Schedule board/planner |
| `/admin/schedule/templates` | Recurring session templates |
| `/admin/subscriptions` | Subscription/billing management |
| `/admin/bulk-import` | CSV bulk import w/ dropzone |
| `/admin/notifications` | Notification center |
| `/admin/profile` | Admin profile (hero w/ avatar, metrics) |
| `/admin/settings` | Settings + account security panel |

**Coach** (`app/(dashboard)/coach/…` — own `layout.tsx`, `error.tsx`, `loading.tsx`)
| Route | Page |
|---|---|
| `/coach` | Coach overview |
| `/coach/clients` | Assigned-client roster |
| `/coach/clients/[clientId]/transformation` | Client transformation/progress detail |
| `/coach/sessions` | Coach sessions |
| `/coach/schedule` | Coach schedule |
| `/coach/notifications` | Notifications |
| `/coach/settings` | Settings |

**Client** (`app/(dashboard)/client/…` — own `layout.tsx`, `error.tsx`, `loading.tsx`)
| Route | Page |
|---|---|
| `/client` | Member overview |
| `/client/coach` | My coach |
| `/client/sessions` | My sessions |
| `/client/progress` | Progress tracking |
| `/client/subscription` | My subscription |
| `/client/notifications` | Notifications |
| `/client/settings` | Settings |

---

## 3. CSS files (all styling lives in these four files)

| File | Lines | Scope |
|---|---|---|
| `app/globals.css` | 404 | Design tokens, Tailwind theme mapping, base element styles, reusable `.mv-*` utilities, keyframes, reduced-motion |
| `app/landing.css` | 2,292 | Landing page (174 unique classes) |
| `app/login/login.css` | 445 | Login page (34 classes) + shared join-credentials screen |
| `app/(dashboard)/dashboard-shell.css` | 3,675 | Entire dashboard system (326 unique classes, BEM naming `block__element--modifier`) |

---

## 4. Design tokens (from `app/globals.css` `:root`)

### Colors
```css
/* Backgrounds */
--mv-bg: #030303;            --mv-bg-soft: #080606;
/* Surfaces */
--mv-surface: #111010;       --mv-surface-strong: #191313;   --mv-surface-dark: #000000;
/* Text */
--mv-text: #ffffff;          --mv-muted: #9b9292;            --mv-muted-strong: #d4cccc;
/* Lines */
--mv-line: rgba(255,255,255,0.10);   --mv-line-strong: rgba(255,255,255,0.16);
/* Brand */
--mv-primary: #e62429;       --mv-primary-deep: #b91c21;     --mv-primary-soft: #2d1011;
--mv-accent: #ff0000;        --mv-accent-soft: #1d0b0c;
/* Semantic */
--mv-success: #34d399;       --mv-warning: #f59e0b;          --mv-danger: #ef4444;
```

### Gradients / surfaces
- `--mv-page-bg`: dual red radial glows (top corners) over vertical near-black gradient `#050303 → #090606 → #030303`
- `--mv-panel-bg`, `--mv-panel-bg-soft`, `--mv-panel-bg-strong`: dark translucent panel gradients with subtle red radial accent
- `--mv-control-bg: rgba(255,255,255,0.035)`, `--mv-control-bg-strong: rgba(230,36,41,0.08)`
- Borders: `--mv-border-subtle` (7.5% white), `--mv-border-strong` (13% white), `--mv-border-accent` (28% red)
- Dashboard aliases: `--mv-dashboard-bg/panel/panel-soft/panel-strong/red-surface/red-surface-strong/text/muted`
  (rule: "black base, red brand, white only for contrast")

### Shadows
```css
--mv-shadow-sm: 0 14px 28px rgba(12,16,24,0.08);
--mv-shadow-md: 0 28px 54px rgba(12,16,24,0.12);
--mv-shadow-glow: 0 16px 30px rgba(230,36,41,0.22);   /* red button glow */
```

### Spacing (fluid clamp scale)
```
3xs 4px | 2xs clamp(6–8px) | xs clamp(10–14px) | sm clamp(14–18px)
md clamp(18–24px) | lg clamp(24–34px) | xl clamp(34–50px) | 2xl clamp(46–80px)
```

### Layout & radii
```
--mv-container: min(1180px, calc(100% - 28px))
--mv-card-pad: clamp(20px, 3.8vw, 30px)      --mv-content-max: 66ch
--mv-radius-control: 14px  --mv-radius-card: 22px  --mv-radius-card-lg: 28px
Tailwind radii: sm 14px / md 22px / lg 30px / xl 999px (pills)
```

### Typography
- Body: Manrope, `font-size: clamp(0.97rem, 0.2vw + 0.95rem, 1.04rem)`, line-height 1.58 (paragraphs 1.72, muted color)
- Headings: Space Grotesk, `letter-spacing: -0.03em`
- Eyebrow style: 0.74rem, weight 800, uppercase, letter-spacing 0.11em, red, with 28px rule before
- Buttons: 0.82rem, weight 800, uppercase, letter-spacing 0.075em
- `::selection`: 30% red background

### Tailwind theme mapping (`@theme inline`)
Functional tokens (`--color-background`, `--color-primary`, `--color-card`, `--color-muted`, `--color-destructive`, `--color-border`, `--color-ring`, etc.) all map to the `--mv-*` palette above. A `.dark` custom variant exists but the app is dark-only today.

### Global reusable utilities (`@layer components` in globals.css)
- `.mv-eyebrow` — overline label with leading rule
- `.mv-panel`, `.mv-panel-soft`, `.mv-panel-strong`, `.mv-panel-accent` — card surfaces
- `.mv-btn` + `.mv-btn-primary` (red gradient + glow) / `.mv-btn-secondary` / `.mv-btn-outline` / `.mv-btn-danger` — 52px pill buttons, hover lift `translateY(-1px)`, focus ring
- `.mv-field` — 56px input, 16px radius, red focus ring, `[aria-invalid="true"]`/`.field-error` danger state

### Animations
Keyframes: `fadeInUp`, `shake`, `spin`, `pulse-subtle`. Utilities: `.animate-fade-in-up`, `.animate-shake`, `.animate-spin-slow`. Full `prefers-reduced-motion: reduce` override (must be preserved in any redesign).

---

## 5. React component inventory

### Landing (`components/landing/`)
| Component | Purpose |
|---|---|
| `landing-sections.tsx` | `LandingHeader` (sticky nav, mobile toggle, login/join CTAs), `LandingServicesSection` (carousel), `LandingReviewsSection` (5-star review carousel), `LandingFooter` (CTA band, nav columns, social icons Facebook/Instagram/TikTok/WhatsApp, locations, copyright); shared internal carousel `<section>` wrapper with prev/next buttons + status |
| `landing-join-modal.tsx` | Join-now modal dialog (`.landing-join-modal*` classes, backdrop, close) |
| `join-now-form.tsx` | The join/lead form fields inside the modal (name/phone/consent, field errors, success/error states) |
| `landing-interactions.tsx` | Client-side behavior: nav toggle, FAQ accordion (`aria-expanded`), carousels, modal open triggers via `data-open-join`, analytics via `data-analytics-source` |
| `landing-structured-data.tsx` | JSON-LD structured data (SEO, no visuals) |

### Shared screens
- `components/join-credentials-screen.tsx` — post-approval credentials display screen (used by landing + login; classes `join-credentials-screen__*`)

### Dashboard building blocks (`components/dashboard/dashboard-*.tsx`) — the design system
| Component | Purpose |
|---|---|
| `dashboard-role-shell.tsx` | Overall shell: sidebar + topbar + `<main>` content; mobile sidebar backdrop |
| `dashboard-sidebar.tsx` | Brand mark, sectioned nav w/ icons + active state, account block, logout |
| `dashboard-topbar.tsx` | Page title/subtitle, search, profile chip w/ avatar + status |
| `dashboard-page-header.tsx` | Per-page eyebrow + title + actions row |
| `dashboard-stat-card.tsx` | KPI card: icon, label, value, change, note; variants accent/success/warning/neutral |
| `dashboard-mini-stat.tsx` | Compact stat (variants accent/success/warning/coach); has its own adoption test |
| `dashboard-activity-feed.tsx` | Timeline feed w/ colored dots (neutral/success/warning) + timestamps |
| `dashboard-empty-state.tsx` | Empty-state block w/ action |
| `dashboard-form-section.tsx` | Titled form section wrapper (header + body) |
| `dashboard-management-toolbar.tsx` | List-page toolbar: filters, search, actions, summary |
| `dashboard-modal.tsx` | Modal (backdrop, panel, wide variant, header/body/footer/close) |
| `dashboard-pagination-controls.tsx` | Pagination summary + page controls |
| `dashboard-route-feedback.tsx` | Route loading/error states (skeleton, error icon) — used by `loading.tsx`/`error.tsx` |
| `dashboard-status-badge.tsx` | Status badge (accent/success/warning) |
| `dashboard-surface-note.tsx` | Callout/note surface w/ list + action, success variant |
| `dashboard-switch.tsx` | Toggle switch (on state, thumb, copy) |
| `account-security-panel.tsx` | Password/security management panel (has unit test) |
| `coach-option-picker.tsx`, `session-type-picker.tsx` | Card-style option pickers (`dashboard-picker-card`, `dashboard-type-picker`) |
| `notification-workspace.tsx` | Notifications list UI (shared across roles) |
| `recurring-session-workspace.tsx` | Recurring session template editor |

### Dashboard workspaces (one per page, compose the blocks above)
`admin-clients-workspace`, `admin-coaches-workspace`, `admin-leads-workspace`, `admin-sessions-workspace`, `admin-schedule-workspace`, `admin-subscriptions-workspace`, `admin-bulk-import-workspace` (tested), `admin-profile-workspace`, `admin-settings-workspace`, `coach-overview-workspace`, `coach-clients-workspace`, `coach-sessions-workspace`, `coach-schedule-workspace`, `coach-settings-workspace`, `coach-transformation-workspace`, `client-overview-workspace`, `client-coach-workspace`, `client-sessions-workspace`, `client-progress-workspace`, `client-subscription-workspace`, `client-settings-workspace`.

### Primitive UI (`components/ui/`)
`badge.tsx`, `brand-lockup.tsx` (logo + wordmark), `card.tsx`, `empty-state.tsx`, `page-header.tsx`, `status-pill.tsx`.

### Providers
`components/providers/session-provider.tsx` — next-auth SessionProvider wrapper (no visuals).

---

## 6. Full CSS class inventory (rename map source for redesign)

### `app/landing.css` (174 classes)
Layout/shell: `site-shell`, `site-header`, `site-nav`, `skip-link`, `section-shell`, `section-grid`, `section-heading`, `split-heading`, `landing-title`, `eyebrow`, `eyebrow-dark`, `mini-label`, `no-js`
Nav: `brand`, `nav-actions`, `nav-links-wrap`, `nav-toggle`, `nav-login-desktop`, `nav-login-mobile`, `nav-login-link`, `nav-join-mobile`, `nav-phone_block`, `btn-nav-login`, `announcement-bar`, `announcement-link`
Hero: `hero`, `hero-layout`, `hero-copy`, `hero-text`, `hero-actions`, `hero-badges`, `hero-note`, `hero-proof`, `hero-stack`, `hero-summary`, `hero-visual`, `hero-visual-img`, `hero-h1-dim`
Buttons: `btn`, `btn-primary`, `btn-secondary`, `btn-outline`, `btn-large`, `btn-submit`, `btn-plan`, `btn-faq-cta`
Panels: `panel`, `panel-soft`, `panel-strong`, `panel-accent`, `logo-panel`, `about-layout`
Carousels: `carousel-shell`, `carousel-header`, `carousel-label`, `carousel-track`, `carousel-controls`, `carousel-btn`, `carousel-status`, `carousel-hint`, `service-track`, `service-card`, `service-icon`, `coach-track`, `coach-card`, `coach-mark`, `coach-role`, `coach-tags`, `benefit-track`, `benefit-card`, `review-track`, `review-card`, `review-stars`, `review-person`, `plan-track`, `plan-card`, `plan-list`, `plan-tag`
Impact/stats: `impact-band`, `impact-shell`, `impact-grid`, `impact-card`, `impact-copy`, `proof-stats`, `proof-copy`, `summary-grid`, `summary-card`, `summary-head`, `summary-label`, `summary-value`, `insight-card`, `insight-list`, `journey-grid`, `journey-step`, `journey-step__index`, `status-pill`
FAQ: `faq-list`, `faq-col`, `faq-item`, `faq-question`, `faq-answer`, `faq-icon`, `support-layout`
Forms: `field`, `field-area`, `field-grid`, `field-grid-single`, `field-error-text`, `form-error`, `form-success`, `consent-row`, `join-form`, `join-modal`, `contact-form`, `contact-form-note`
Contact: `contact-panel`, `contact-split`, `contact-info`, `contact-list`, `contact-row`, `contact-badge`, `contact-reassurance`, `contact-social`
Modal: `landing-join-modal` (+ `__backdrop`, `__panel`, `__header`, `__body`, `__copy`, `__close`), `modal-close`, `modal-copy`
Credentials screen: `join-credentials-screen` (+ `--landing`, `__card`, `__header`, `__note`, `__stack`)
Footer: `site-footer`, `footer-cta-band`, `footer-cta`, `footer-cta-title`, `footer-cta-desc`, `footer-cta-actions`, `footer-cta-logo`, `footer-grid`, `footer-brand`, `footer-logo`, `footer-col`, `footer-col-brand`, `footer-nav`, `footer-nav-cols`, `footer-heading`, `footer-links`, `footer-link-button`, `footer-join-btn`, `footer-location-list`, `footer-loc-item`, `footer-rule`, `footer-bottom`, `footer-bottom--compact`, `footer-copyright`, `footer-social-circ`, `footer-social-link-facebook/-instagram/-tiktok/-whatsapp`, `social-row`, `social-btn`, `social-btn-facebook/-instagram/-tiktok`, `form-footer-social`, `whatsapp-btn`

### `app/login/login.css` (34 classes)
`login-page`, `login-container`, `login-form-panel`, `login-form`, `login-form-header`, `login-form-title`, `login-form-subtitle`, `login-method-tabs`, `login-method-tab`, `login-field-group`, `login-field-label`, `login-field-wrap`, `login-field-error`, `login-password-toggle`, `login-error`, `login-error-icon`, `login-forgot`, `login-help-row`, `login-helper-note`, `login-inline-note`, `login-callout`, `login-loading`, `login-spinner`, `login-submit`, `login-submit-content`, `login-state-panel` (+ `__actions`, `__icon`), `login-trust-note`, `login-back` + shared `join-credentials-screen__*`

### `app/(dashboard)/dashboard-shell.css` (326 classes — BEM)
Shell & chrome: `dashboard-shell`, `dashboard-main`, `dashboard-content`, `dashboard-sidebar` (+ `__brand`, `__brand-image`, `__brand-mark`, `__brand-copy`, `__nav`, `__section`, `__section-label`, `__link`, `__link--active`, `__link--muted`, `__icon`, `__item-copy`, `__account`, `__account-copy`, `__account-error`, `__logout`, `__close`), `dashboard-sidebar-backdrop(--visible)`, `dashboard-topbar` (+ `__left`, `__right`, `__title`, `__subtitle`, `__meta`, `__search`, `__search-copy`, `__search-hint`, `__avatar`, `__profile`, `__profile-copy`, `__profile-separator`, `__profile-status`), `dashboard-menu-toggle`
Page scaffolding: `dashboard-page-header` (+ `__content`, `__eyebrow`, `__actions`), `dashboard-grid`, `dashboard-stack(--dense)`, `dashboard-overview-grid(--admin)`, `dashboard-secondary-grid(--admin)`, `dashboard-kpi-grid`, `dashboard-mini-grid`, `dashboard-quick-grid`, `dashboard-quick-card(__icon)`, `dashboard-data-region`, `dashboard-info-strip`
Panels & cards: `dashboard-panel` (+ `--accent`, `--dense`, `--nested`, `__header`, `__header--tight`, `__meta-strip`), `dashboard-stat-card` (+ variants `--accent/--neutral/--success/--warning`, elements `__header/__icon/__label/__value/__change/__detail/__note/__footer`), `dashboard-mini-stat` (+ `--accent/--coach/--success/--warning`, `__label`), `dashboard-record-card` (+ `--active/--client/--coach/--lead/--session/--subscription`, `__eyebrow/__header/__meta/__note`), `dashboard-detail-panel`, `dashboard-detail-grid`, `dashboard-detail-layout`, `dashboard-detail-stat(__label)`, `dashboard-snapshot-list`, `dashboard-snapshot-item`, `dashboard-summary-list`, `dashboard-summary-row`, `dashboard-profile-hero` (+ `__copy`, `__identity`), `dashboard-profile-avatar`, `dashboard-profile-metric(__icon)`, `dashboard-contact-block`, `dashboard-contact-card`, `dashboard-contact-grid`
Feed & status: `dashboard-activity-feed` (+ `__item(--neutral/--success/--warning)`, `__dot`, `__content`, `__time`), `dashboard-badge(--accent/--success/--warning)`, `dashboard-badge-stack`, `dashboard-surface-note` (+ `--success`, `__header`, `__list`, `__action`), `dashboard-route-state` (+ `--error`, `__icon`, `__skeleton`), `dashboard-empty-state(__action)`, `dashboard-progress`
Admin overview: `dashboard-admin-action-list`, `dashboard-admin-action-row` (+ `--primary`, `__content`, `__cta`, `__eyebrow`, `__icon`), `dashboard-admin-priority-grid`, `dashboard-admin-snapshot-row(__header/__meta)`
Forms & controls: `dashboard-form-grid`, `dashboard-form-columns`, `dashboard-form-field(--wide)`, `dashboard-form-section(__header/__body)`, `dashboard-input`, `dashboard-select`, `dashboard-textarea`, `dashboard-switch` (+ `__control(--on)`, `__thumb`, `__copy`), `dashboard-segmented` (+ `__button(--active)`), `dashboard-day-picker`, `dashboard-day-chip(--active)`, `dashboard-type-picker` (+ `__option(--active)`), `dashboard-picker-list`, `dashboard-picker-card(--active)`, `dashboard-coach-picker(__summary)`, `dashboard-inline-button`, `dashboard-search-field` (+ `__controls`, `__label`), `dashboard-search-suggestions`, `dashboard-search-suggestion`, `dashboard-filter-field(--sort)`, `dashboard-import-dropzone(--over)`
Toolbars & lists: `dashboard-toolbar` (+ `__main`, `__side`, `__filters`, `__actions`, `__summary`), `dashboard-selection-summary`, `dashboard-row-actions`, `dashboard-pagination` (+ `__controls`, `__page`, `__summary`), `dashboard-mobile-list(--always)`
Tables: `dashboard-table`, `dashboard-table-wrap`, `dashboard-table__identity`, `dashboard-client-table__billing/__program/__readiness`, `dashboard-coach-table__load/__metric/__specialization`, `dashboard-lead-table__action/__action-stack/__approve(--small)/__delete/__message/__meta/__status`, `dashboard-lead-row--converted`, `dashboard-session-table__action/__capacity/__client/__status/__timing`, `dashboard-subscription-table__action/__billing/__plan/__status`
Clients workspace: `dashboard-clients-shell(--single)`, `dashboard-clients-roster-panel`, `dashboard-clients-roster-list`, `dashboard-clients-roster-item` (+ `--active`, `__meta`, `__topline`), `dashboard-clients-detail-panel`, `dashboard-clients-filters`, `dashboard-clients-filter-group(__label)`, `dashboard-clients-search(__controls/__input)`, `dashboard-clients-checkbox(--compact)`, `dashboard-clients-checkbox-row`, `dashboard-clients-initials`, `dashboard-clients-toolbar(__copy)`
Sessions: `dashboard-session-list`, `dashboard-session-card` (+ `--admin`, `__detail`, `__footer(--admin)`, `__headline`, `__location`, `__meta`, `__name`, `__occupancy`, `__progress-block`, `__progress-label`, `__time`, `__time-block`, `__topline`), `dashboard-session-roster-grid`
Schedule: `dashboard-schedule-board(--single)`, `dashboard-schedule-day(__header/__list)`, `dashboard-schedule-dayline` (+ `__actions/__check/__day(--active)/__days/__event(--active)/__event-badges/__event-head/__event-meta/__lane/__lane-wrap`), `dashboard-schedule-grid` (+ `__day/__day-body/__day-header/__days/__event(--active)/__event-badges/__event-top/__hour/__hours/__line`), `dashboard-schedule-planner` (+ `__actions/__check/__collapsed-copy/__day/__day-body/__day-header/__day-toggle/__event(--active)/__event-badges/__event-head/__event-meta`), `dashboard-schedule-session` (+ `--active`, `__badges`, `__meta`, `__topline`)
Modal & credentials: `dashboard-modal` (+ `__backdrop`, `__panel(--wide)`, `__header`, `__body`, `__footer`, `__close`), `dashboard-credentials-screen` (+ `__card`, `__footnote`, `__grid`, `__header`)

---

## 7. Interaction & accessibility patterns to preserve

- **Skip link** (`.skip-link` → `#main`) on the landing page.
- **FAQ accordion**: buttons with `aria-expanded` / `aria-controls`; JS in `landing-interactions.tsx`.
- **Carousels**: prev/next buttons with `aria-label`, focusable scroll track (`tabIndex={0}` + `aria-label`), status text.
- **Join modal** opened by any element with `data-open-join`; analytics via `data-analytics-source` attributes (hero CTA, FAQ CTA, nav) — keep these data attributes.
- **Forms**: error states via `aria-invalid="true"` + `.field-error` / `.login-field-error` / `field-error-text`.
- **Search suggestions** (dashboard topbar/clients): accessible listbox-pattern was recently fixed — keep roles/keyboard nav intact.
- **Reduced motion**: global `prefers-reduced-motion` override must survive the redesign.
- **Mobile**: hamburger `nav-toggle` on landing; `dashboard-menu-toggle` + `dashboard-sidebar-backdrop` off-canvas sidebar on dashboard; fluid clamp() type/spacing; container `min(1180px, 100% - 28px)`.
- **Dark-only** UI currently; body min-width 320px.

## 8. Assets

- `public/img/Logo-1.png` (canonical logo, used in metadata/manifest)
- `public/img/Logo-2.png`
- `public/img/Logo-3.png` (used in landing About section, 2000×985)
- Icons everywhere else come from `lucide-react` (no icon fonts, no SVG sprite).

## 9. Guidance for the redesign

1. **Keep the file architecture**: tokens + utilities in `globals.css`, one CSS file per surface (landing / login / dashboard shell). A redesign can be executed largely by re-theming `:root` tokens + the four CSS files without touching TSX markup.
2. **Prefer re-styling existing class names** over renaming: class names are referenced across ~50 TSX components, unit tests, the design-system adoption test, and Playwright e2e selectors.
3. If markup changes are needed, keep aria attributes, `data-open-join`, `data-analytics-source`, and ids (`#main`, `#services`, `#reviews`, `#about`, `#faq`, `#navLinks`, `#navToggle`, `#btnLogin`, `#btnJoinNav`, `#btnJoinHero`, `faq-1..4`) — JS and analytics hook onto them.
4. Fonts are loaded via `next/font` variables `--font-body` / `--font-display`; to change typefaces edit `app/fonts.ts` and the `@theme` block.
5. Server components render most pages; interactive pieces are isolated in `components/landing/landing-interactions.tsx` and the dashboard workspace components.
