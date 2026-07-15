# Handoff: Marvel's Fit Studios — Dark/Red Visual System (v2)

## Overview
This is the complete visual palette and component spec for the **Marvel's Fit Studios** ("Marvel Fit") web system — a premium performance-training studio management platform (admin / coach / client portals + marketing + auth).

The system was redesigned from a near-black + Marvel-red identity into a refined **dark-ink · brand-red · pastel-data** language: layered charcoal surfaces, large radii, red as the brand voice (CTAs, active nav, live data), and soft pastels reserved for charts and highlights. This document is the source of truth for that palette so you can build every screen consistently from it.

## About the Design Files
The files in `references/` are **design references created in HTML** — prototypes showing the intended look and behavior. **They are not production code to copy directly.** They are authored in a lightweight streaming-HTML component format (`.dc.html`) and are meant to be read as visual specs.

Your task is to **recreate this visual system in the target codebase** (per the original app this is **Next.js 16 App Router + React 18 + Tailwind CSS v4 + hand-written CSS**, `lucide-react` icons) using its established patterns. The original architecture keeps design tokens + utilities in `app/globals.css` and one CSS file per surface (`landing.css`, `login.css`, `dashboard-shell.css`) — **a re-theme is executed largely by editing `:root` tokens + those CSS files, without rewriting the ~50 TSX components.** Preserve existing class names, `aria-*`, `data-open-join`, `data-analytics-source`, and element ids (tests + analytics hook onto them).

## Fidelity
**High-fidelity (hifi).** Exact colors, radii, spacing, and typography are given below and used in the reference files. Recreate pixel-for-pixel using the codebase's libraries.

---

## Design Tokens

### Color palette (the core deliverable)

**Backgrounds & surfaces (layer order — contrast separates layers, avoid borders between them):**
| Token | Hex | Use |
|---|---|---|
| `--mv-canvas` | `#0A0A0B` | App/page background (darkest) |
| `--mv-canvas-alt` | `#1B1B1C` | Alternate canvas / inset regions |
| `--mv-panel` | `#0C0C0D` | Primary panels & cards (radius 22–28) |
| `--mv-surface` | `#161618` | Nested surface inside a panel (radius 16–20) |
| `--mv-surface-2` | `#222225` | Raised chips / secondary button base |

**Brand (red — the voice; strict budget, see Rules):**
| Token | Hex | Use |
|---|---|---|
| `--mv-primary` | `#E62429` | Brand red — primary CTAs, active nav, live/today data |
| `--mv-primary-deep` | `#B91C21` | Gradient end / pressed |
| `--mv-primary-bright` | `#FF5A5E` | Chart line, icon strokes on dark |
| `--mv-primary-tint` | `#FF6B6E` | Negative delta text on dark |
| Primary gradient | `linear-gradient(135deg, #E62429, #C11F24)` | Buttons, active nav pill, active calendar day |
| Red wash | `rgba(230,36,41,0.14)` | Icon-chip backgrounds |

**Pastels (support only — data, highlights, one featured card per screen; never text/buttons):**
| Token | Hex | Use |
|---|---|---|
| `--mv-rose` | `#FFD9D8` | Secondary pastel / featured-card base / accent |
| `--mv-rose-deep` | `#F3C9C8` | Featured-card gradient end |
| `--mv-mint` | `#DCEFE2` | Positive/secondary data series |
| `--mv-lavender` | `#E7E2F7` | Optional data series (avatar accents) |
| `--mv-peach` | `#FBE8CE` | Optional data series |
| Text on any pastel | `#1D0809` | Dark ink — the ONLY text color on pastel surfaces |

**Text & lines:**
| Token | Hex / value | Use |
|---|---|---|
| `--mv-text` | `#FFFFFF` | Primary text |
| `--mv-text-2` | `#C9C4C4` | Secondary text |
| `--mv-muted` | `#928C8C` | Muted labels |
| `--mv-muted-2` | `#6E6868` | Faint labels / axis ticks |
| `--mv-line` | `rgba(255,255,255,0.06)` | Hairline dividers |
| `--mv-line-strong` | `rgba(255,255,255,0.10)` | Input borders |
| `--mv-control` | `rgba(255,255,255,0.05)` | Ghost control background |
| `--mv-control-hover` | `rgba(255,255,255,0.10)` | Ghost control hover |

**Semantic:**
| Token | Hex | Use |
|---|---|---|
| `--mv-success` | `#7ED9A2` | Positive delta text/dots |
| `--mv-danger` | `#FF6B6E` | Negative delta text |

**Avatar fills (decorative, member stacks):** `#E8A5A3` (rose), `#C9B6E8` (lavender), `#A5D8C0` (mint), overflow chip `rgba(255,255,255,0.10)` with `#FFD9D8` text.

### Typography
- **Family:** `Hanken Grotesk` (Google Fonts, weights 400/500/600/700/800). *(This is the free stand-in for the brand's Euclid Circular A — swap to Euclid via `@font-face` in production if licensed.)* Fallback: `sans-serif`.
- **Display / values:** weight 800, `letter-spacing: -0.03em` (headlines) / `-0.02em` (numeric values). Sizes: page H1 26–27px, panel title 17–19px, big value 27–34px, hero display 44px+.
- **Body:** weight 400–600, 13.5–15px, line-height 1.6, color `--mv-text-2` / `--mv-muted`.
- **Eyebrow:** weight 800, 12px, `text-transform: uppercase`, `letter-spacing: 0.14em`, color `--mv-primary`.
- **Nav / labels:** weight 700, 13.5px. Micro labels 10.5–11px, weight 700, uppercase, `letter-spacing: 0.12em`, color `--mv-muted-2`.
- **Buttons:** weight 800, 12–12.5px, uppercase, `letter-spacing: 0.075em`.

### Spacing
Base grid **14px** — the standard gap between panels and cards, and the app padding. Inner scale: `4 / 6 / 8 / 10 / 14 / 18 / 22 / 24px`. Panel padding 22–26px; card padding 20–24px.

### Border radius
| Token | Value | Use |
|---|---|---|
| `--r-pill` | `999px` | Buttons, filter pills, highlight tags, progress bars |
| `--r-panel-lg` | `28px` | Sidebar, outermost panels |
| `--r-panel` | `22px` | Cards, chart panels, top nav bar |
| `--r-surface` | `20px` | Nested surfaces |
| `--r-control` | `14px` | Inputs, icon buttons, ghost buttons, list rows |
| `--r-chip` | `12px` | Icon chips, small nav pills, calendar day |
| `--r-icon` | `11px` | Small 34px icon tiles |

### Shadows
**None.** This system is intentionally **flat** — no `box-shadow` anywhere (glows and drop-shadows were removed per design decision). Separation is achieved through the surface-layer contrast only.

### Motion
- Buttons: hover `transform: translateY(-1px)` (subtle lift), ~150ms ease.
- Ghost controls: hover swaps background `--mv-control` → `--mv-control-hover`; nav items add `rgba(255,255,255,0.04)` bg + white text on hover.
- Inputs: focus ring `border-color: #E62429; box-shadow: 0 0 0 3px rgba(230,36,41,0.22)` (the one intentional "shadow" — a focus ring, keep it).
- Respect `prefers-reduced-motion: reduce` (disable transforms/transitions).

---

## Core Components (spec)

**Buttons**
- *Primary:* red gradient `linear-gradient(135deg,#E62429,#C11F24)`, white text, radius pill (or 14px in-panel), padding 15×28px, uppercase 800/12px/0.075em, no shadow, hover lift.
- *Secondary:* `--mv-control` bg, white text, same metrics, hover → `--mv-control-hover`.
- *Outline:* transparent, `1px solid rgba(255,255,255,0.16)`, hover border → `0.35`.
- *Icon button:* 42×42 (or 30–34 compact), radius 14/10px, `--mv-control` bg, hover `--mv-control-hover`.

**Pills / badges:** radius 999px, padding 7×16px, 12px/700. Highlight = rose `#FFD9D8` bg + `#1D0809` text; positive = mint `#DCEFE2` + `#10281A`; alert = `rgba(230,36,41,0.14)` bg + `#FF6B6E` text.

**KPI card:** panel `#0C0C0D`, radius 22, padding 22. Contents: 44×44 icon chip (radius 14, red/pastel wash bg, colored 18px lucide stroke icon), muted 13px label, 27px/800 value, delta row (triangle/arrow + colored % + muted context).

**Featured card (one per screen):** rose→`#F3C9C8` diagonal gradient, `#1D0809` text, radius 22, faint diagonal-stripe SVG overlay at ~0.3 opacity, an 800 value, and a white-75% highlight pill. Optional donut ring (deep-red arc on white-55% track).

**Chart palette & order of use:** red (live/today) → rose → mint → white55% → white16% (context). Bars: rounded pill columns, active bar = red gradient. Line: `#FF5A5E` 2.6px stroke over a red→transparent area fill; comparison line = `rgba(255,255,255,0.35)` dashed. Donut: colored arc on faint track, value centered.

**List row:** avatar (36px, `#2A2224` bg + `#FFD9D8` initials, or gradient), name 13.5/700, meta 11.5/muted, right-aligned delta (success/danger). Divider `1px solid rgba(255,255,255,0.06)`.

**Input:** `rgba(255,255,255,0.05)` bg, `1px solid rgba(255,255,255,0.09)`, radius 14, padding 15×18, white text; focus ring as above.

**Sidebar (dashboard shell):** 248px, panel `#0C0C0D`, radius 28, padding 22×16. Brand lockup (logo 38px, no frame — the plain PNG on transparent) + title + role. Sectioned nav (uppercase micro label + items); active item = red-gradient pill; account block at bottom (`rgba(255,255,255,0.04)`, radius 16).

**Top nav (alt layout):** full-width bar, panel `#0C0C0D`, radius 22, padding 14×22 — logo+wordmark, nav pills (active = red gradient), search field (flex, `--mv-control` bg), bell icon button with red dot, avatar.

**Calendar / schedule:** week grid, active day = red-gradient chip; day column = time gutter + class blocks (`border-left: 3px solid <accent>`, tinted bg: red wash / mint 0.10 / rose 0.09), empty slots = 1px dashed `rgba(255,255,255,0.07)`.

---

## Layout Patterns
- **App shell:** 14px padding, 14px gaps everywhere. Two shells shown: (a) left icon/sidebar + left summary column + main grid (Admin Dashboard); (b) full-width top nav + `1fr / 400px` two-column body (Scheduling Dashboard).
- **Grids:** KPI row `repeat(4, 1fr)`; chart row `1fr 1fr`; right rail fixed 400px.
- **Responsive:** container-fluid; collapse multi-column grids to single column and convert sidebar to off-canvas (`menu-toggle` + backdrop) under ~900px. Body min-width 320px.

## Usage Rules (enforce these)
1. **Layering:** canvas `#0A0A0B` → panel `#0C0C0D` (r28/22) → surface `#161618` (r20). No borders between layers; contrast separates.
2. **Red budget:** at most one red CTA + one active nav item + live-data marks per screen. Everything else is ink + pastel.
3. **Pastels never speak:** rose/mint/lavender/peach carry data and highlights only — never body text, never button fills. Text on pastel is always `#1D0809`.
4. **Flat:** no drop shadows; only the input focus ring uses a ring.

## Screens / Views (reference files)
- **`references/Style Guide.dc.html`** — the palette board, type scale, component gallery, and rules. Your primary reference.
- **`references/Admin Dashboard.dc.html`** — admin overview: icon sidebar, summary column (featured card, occupancy, top coaches), KPI row, weekly/revenue charts, attendance candles.
- **`references/Scheduling Dashboard.dc.html`** — class scheduling: top nav, revenue/payout donut cards, earnings line graph, upcoming classes, week calendar, day schedule, floating class-detail/booking panel.

Open any file directly in a browser to view it.

## Assets
- `references/assets/Logo-1.png` — canonical Marvel Fit logo (2000×2000, transparent PNG). Use on transparent background at ~38px in lockups (no colored frame). Logo-2/Logo-3 variants exist in the original project's `public/img/`.
- All other icons: **`lucide-react`** (no icon fonts, no SVG sprites) — the reference files inline equivalent lucide paths.

## Notes
- Fonts load via `next/font` variables in the original app; to switch to Euclid Circular A (the true brand face) edit `app/fonts.ts` + the Tailwind `@theme` block.
- The `.dc.html` reference format needs `references/support.js` beside it to render — it's included for completeness; you do not port it.
