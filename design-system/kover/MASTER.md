# Design System: Kover

> **LOGIC:** When building a specific page, first check `design-system/kover/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** Kover — Route Management Dashboard
**Generated:** 2026-02-13
**Type:** Internal operational tool / admin dashboard
**Users:** Admin (business owner) + Courier (55 years old, prints only)

---

## Style: Minimalism + Flat Design

**Why:** Operational dashboard, data-heavy, replaces Excel. Needs clarity, not decoration.

- **Performance:** Excellent
- **Accessibility:** WCAG AAA
- **Complexity:** Low
- No gradients, no glow effects, no ornaments
- Clean borders, high contrast, functional layout
- Transitions: 150-200ms ease (hover, focus, state changes)
- Dark mode first (project convention), light mode supported

---

## Layout Pattern: Sidebar Dashboard

```
┌──────────┬──────────────────────────────────────┐
│          │  Top Bar: Day Switcher (ПН-ПТ)       │
│  Sidebar │──────────────────────────────────────│
│          │  Summary Cards (KPI)                  │
│  - Route │──────────────────────────────────────│
│  - Clients│  Main Content                        │
│  - Import │  (list / table / form)               │
│          │                                      │
│          │                                      │
└──────────┴──────────────────────────────────────┘
```

- Sidebar: collapsible on mobile, icon-only mode
- Top bar: contextual controls (day switcher, search, print button)
- Main area: scrollable content, no nested scroll containers
- Mobile: bottom navigation tabs instead of sidebar

---

## Color Palette

### Dark Mode (Primary)

| Role | Tailwind | Hex | Usage |
|------|----------|-----|-------|
| Background | `slate-950` | `#020617` | Page background |
| Surface | `slate-900` | `#0F172A` | Cards, sidebar |
| Surface Raised | `slate-800` | `#1E293B` | Hover states, active items |
| Border | `slate-700` | `#334155` | Dividers, card borders |
| Text Primary | `slate-50` | `#F8FAFC` | Headings, body text |
| Text Secondary | `slate-400` | `#94A3B8` | Labels, hints, muted |
| Primary | `blue-600` | `#2563EB` | Active day, links, focus rings |
| Primary Hover | `blue-500` | `#3B82F6` | Hover on primary elements |
| CTA / Warning | `orange-500` | `#F97316` | Action buttons, badges, alerts |
| Success | `green-500` | `#22C55E` | Completed stops, saved states |
| Destructive | `red-500` | `#EF4444` | Delete, remove from route |

### Light Mode

| Role | Tailwind | Hex |
|------|----------|-----|
| Background | `slate-50` | `#F8FAFC` |
| Surface | `white` | `#FFFFFF` |
| Surface Raised | `slate-100` | `#F1F5F9` |
| Border | `slate-200` | `#E2E8F0` |
| Text Primary | `slate-900` | `#0F172A` |
| Text Secondary | `slate-500` | `#64748B` |
| Primary | `blue-600` | `#2563EB` |
| CTA / Warning | `orange-500` | `#F97316` |
| Success | `green-600` | `#16A34A` |
| Destructive | `red-600` | `#DC2626` |

---

## Typography

**Font:** Inter (Shadcn/ui default, already included)

**Why:** Optimized for screens, highly readable at all sizes, great for data tables.
Single font with weight variations = simplicity + fast loading.
NOT Fira Code — monospace is hard to read for older users.

| Element | Size | Weight | Tailwind |
|---------|------|--------|----------|
| Page title | 24px / 1.5rem | 700 (bold) | `text-2xl font-bold` |
| Section heading | 18px / 1.125rem | 600 (semibold) | `text-lg font-semibold` |
| Card title | 16px / 1rem | 600 (semibold) | `text-base font-semibold` |
| Body / Table cells | 16px / 1rem | 400 (normal) | `text-base` |
| Labels / Muted | 14px / 0.875rem | 500 (medium) | `text-sm font-medium` |
| Badges / Counts | 12px / 0.75rem | 600 (semibold) | `text-xs font-semibold` |
| Data numbers | 16px / 1rem | 600, tabular-nums | `text-base font-semibold tabular-nums` |

**Rules:**
- Minimum body text: 16px (accessibility for older user)
- Line height: 1.5 for body, 1.25 for headings
- `tabular-nums` for all numeric data (alignment in tables)
- `font-variant-numeric: tabular-nums` on route stop numbers, mat counts, area calculations

---

## Spacing

Base unit: 4px (Tailwind default)

| Token | Tailwind | Usage |
|-------|----------|-------|
| `gap-1` | 4px | Tight inline items |
| `gap-2` | 8px | Icon + text, between badges |
| `gap-3` | 12px | Between list items |
| `gap-4` | 16px | Card padding, section gaps |
| `gap-6` | 24px | Between cards |
| `gap-8` | 32px | Between sections |

---

## Component Specs (Shadcn/ui)

### Buttons
- Minimum height: 44px (touch target for courier)
- `cursor-pointer` on all clickable elements
- Primary: `bg-blue-600 hover:bg-blue-500 text-white`
- Destructive: `bg-red-600 hover:bg-red-500 text-white`
- CTA: `bg-orange-500 hover:bg-orange-400 text-white`
- Ghost: `hover:bg-slate-800` (dark) / `hover:bg-slate-100` (light)

### Cards (Route Stop)
```
┌──────────────────────────────────────────────┐
│  [3]  Метрополис, К. Маркса           2.7 м² │
│       2×180  2×150                    [✓] [⋯] │
└──────────────────────────────────────────────┘
```
- Border-left: 3px `border-l-blue-500`
- Padding: 12px 16px
- Hover: `bg-slate-800` (dark) / `bg-slate-50` (light)
- Active drag: `ring-2 ring-blue-500 shadow-lg`

### Day Switcher (ПН-ПТ)
- 5 buttons, pill-style group
- Active: `bg-blue-600 text-white`
- Inactive: `bg-transparent text-slate-400 hover:text-white`
- Badge with stop count: `bg-slate-700 text-xs tabular-nums`

### Summary Block
- Row of metric cards at top of route view
- Each card: icon + value + label
- Values: `text-2xl font-bold tabular-nums`
- Labels: `text-sm text-slate-400`

### Data Tables (TanStack Table)
- Row height: 48px minimum (touch-friendly)
- Alternating rows: subtle `bg-slate-900/50`
- Sort indicators: `ChevronUp` / `ChevronDown` from Lucide
- Sticky header on scroll
- Horizontal scroll with `overflow-x-auto` wrapper on mobile

### Modals
- Overlay: `bg-black/50 backdrop-blur-sm`
- Max-width: 500px, centered
- Close button: `X` icon, top-right, 44x44px touch target
- Confirm destructive: red CTA button

### Forms
- Input height: 44px minimum
- Label above input (not floating)
- Validation errors: red text below field, `ring-red-500`
- Autosave: toast "Saved" for 2 seconds (Shadcn Sonner)

---

## Accessibility (Courier User, 55 years)

- **Touch targets:** minimum 44x44px for all interactive elements
- **Font size:** minimum 16px body, 14px only for labels/badges
- **Contrast:** WCAG AAA (7:1 for normal text, 4.5:1 for large)
- **Focus rings:** visible `ring-2 ring-blue-500 ring-offset-2`
- **Keyboard navigation:** full tab order, Enter to activate
- **`prefers-reduced-motion`:** disable transitions when set
- **No color-only indicators:** always pair color with icon/text
- **aria-label:** on all icon-only buttons (print, delete, move)

---

## Print Layout (Route Sheet)

Separate CSS for `@media print`:

- **Hide:** sidebar, navigation, buttons, search, toasts
- **Show:** route table + header + totals only
- **Font:** system serif (Times New Roman), 14pt body, 18pt+ headings
- **Color:** black & white only (save toner)
- **Layout:** A4 portrait, margins 15mm
- **Table:** full borders, alternating light grey rows
- **Columns:** # | Name (originalName) | 180 | 150 | 60x80 | 400 | 250 | Area | Checkbox
- **Footer:** total row (counts per size + total area)
- **Checkbox column:** empty 15x15mm square for manual marks

---

## Icons

- **Library:** Lucide React (Shadcn ecosystem)
- **Size:** 20x20px (w-5 h-5) default, 16x16px (w-4 h-4) in badges
- **No emojis as icons** — only SVG
- **Key icons:**
  - Route: `MapPin`, `Truck`, `Navigation`
  - Actions: `Plus`, `Trash2`, `GripVertical`, `ArrowUpDown`, `Printer`
  - Status: `Check`, `Circle`, `AlertTriangle`
  - UI: `Search`, `ChevronDown`, `X`, `Menu`

---

## Anti-Patterns (DO NOT USE)

- No emojis as icons
- No inline styles (use Tailwind)
- No glow/neon effects
- No gradients on backgrounds
- No scale transforms on hover (causes layout shift)
- No font size below 14px
- No color-only status indicators
- No light mode default (dark mode first)
- No auto-playing animations
- No nested scroll containers

---

## Pre-Delivery Checklist

- [ ] No emojis used as icons (Lucide only)
- [ ] `cursor-pointer` on all clickable elements
- [ ] Hover states: smooth transitions 150-200ms
- [ ] Touch targets: minimum 44x44px
- [ ] Text contrast: 4.5:1 minimum (7:1 preferred)
- [ ] Focus states: visible ring on all interactive elements
- [ ] `prefers-reduced-motion` respected
- [ ] `tabular-nums` on all numeric data
- [ ] Responsive: 375px, 768px, 1024px, 1440px
- [ ] Print layout: tested with Ctrl+P
- [ ] aria-label on icon-only buttons
- [ ] No horizontal scroll on mobile (except data tables)
