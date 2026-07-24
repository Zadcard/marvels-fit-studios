# UI/UX Design System Specification - Marvels Fit Studios

## 1. Brand Aesthetics & Visual Principles
Marvels Fit Studios uses a high-contrast dark theme ("Redline" design language) tailored for high-energy fitness studio operations. The aesthetic combines vibrant accent colors, sleek glassmorphism panels, clear visual typography hierarchy, and consistent micro-interactions.

---

## 2. Token Architecture & Color Palette

### Base Surfaces & Backgrounds
- **Background Root**: `hsl(224, 71%, 4%)` (`#090d16`) - Deep space dark background.
- **Card Surface**: `hsl(222, 47%, 11%)` (`#0f172a`) - Raised container background.
- **Surface Elevation**: `hsl(217, 33%, 17%)` (`#1e293b`) - Muted interactive surface.
- **Border Overlay**: `hsl(217, 19%, 27%)` (`#334155`) - Subtle structural borders.

### Accent & Brand Colors
- **Primary Redline Crimson**: `hsl(346, 84%, 53%)` (`#e11d48`) - Primary CTAs, active indicators, brand emphasis.
- **Primary Hover**: `hsl(346, 84%, 45%)` (`#be123c`) - Interactive hover state.
- **Secondary Slate**: `hsl(215, 20%, 65%)` (`#94a3b8`) - Secondary text and subtle borders.
- **Success Emerald**: `hsl(142, 71%, 45%)` (`#10b981`) - Active client badges, paid payments, attended sessions.
- **Warning Amber**: `hsl(38, 92%, 50%)` (`#f59e0b`) - Expiring subscriptions, due soon payments, pending leads.
- **Error Rose**: `hsl(0, 84%, 60%)` (`#ef4444`) - Destructive actions, missed attendance, failed payments.
- **Info Cyan**: `hsl(199, 89%, 48%)` (`#0ea5e9`) - Operational alerts, informational toasts.

---

## 3. Typography & Hierarchy

- **Font Family**: Inter, system-ui, -apple-system, sans-serif.
- **Display Heading (`H1`)**: `text-2xl sm:text-3xl font-bold tracking-tight text-white`
- **Section Heading (`H2`)**: `text-xl font-semibold text-white tracking-tight`
- **Card Title (`H3`)**: `text-lg font-medium text-slate-100`
- **Body Text**: `text-sm text-slate-300 leading-relaxed`
- **Caption / Secondary Text**: `text-xs text-slate-400 font-medium`

---

## 4. Reusable Primitives & Components

### Buttons
- **Primary Button**: `bg-rose-600 hover:bg-rose-700 text-white font-medium px-4 py-2 rounded-lg shadow-sm transition-colors disabled:opacity-50`
- **Secondary Button**: `bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium px-4 py-2 rounded-lg transition-colors`
- **Ghost Button**: `hover:bg-slate-800 text-slate-300 hover:text-white font-medium px-3 py-1.5 rounded-lg transition-colors`
- **Destructive Button**: `bg-red-600 hover:bg-red-700 text-white font-medium px-4 py-2 rounded-lg transition-colors`

### Inputs & Forms
- **Text & Select Inputs**: `w-full bg-slate-900 border border-slate-700 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 text-slate-100 placeholder-slate-500 rounded-lg px-3.5 py-2 text-sm transition-all`
- **Form Label**: `block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5`
- **Form Error Notice**: `text-xs text-rose-400 font-medium mt-1`

### Status Badges
- **Active Badge**: `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20`
- **Pending / Due Soon Badge**: `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20`
- **Inactive / Expired Badge**: `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20`
- **Paused / Alert Badge**: `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20`

---

## 5. Responsive Breakpoints & Mobile Adaptability
- **Mobile First**: Single column stacked layout below `640px`. Touch tap targets set to minimum `44px x 44px`.
- **Tablet (`768px - 1024px`)**: 2-column grid layout for metric cards and form inputs. Side navigation collapses to top bar.
- **Desktop (`>= 1024px`)**: Fixed left navigation sidebar with fluid content area and 3/4 column metric dashboards.
- **Text Truncation**: Table text cells enforce `truncate max-w-[180px] sm:max-w-none` to prevent cell wrapping on narrow mobile screens.
