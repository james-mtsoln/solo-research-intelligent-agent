# Research Intelligence Dashboard v2 — Global Design

Redesigned using www.mtsoln.com as the design reference. Ultra-premium dark mode, AI-focused aesthetic, mobile-first responsive.

## Page List

| Page | File | Route | Description |
|------|------|-------|-------------|
| Dashboard | `home.md` | `/` | Overview with weekly plan stats, recent activity, quick actions |
| Weekly Plans | `weekly-plans.md` | `/plans` | Grid of weekly business plans with metadata, status, actions |
| Plan Detail | `plan-detail.md` | `/plans/:id` | Deep-dive: news feed, AI analysis, business plan timeline |
| Agents | `agents.md` | `/agents` | Browse, install, configure AI research agents |
| Settings | `settings.md` | `/settings` | AI providers (Ollama/OpenAI/Anthropic/Kimi/Gemini), data sources, preferences |

---

## Color Palette (mtsoln.com-inspired)

### Backgrounds

| Token | Hex | Usage |
|-------|-----|-------|
| `--bg-primary` | `#0A0A0F` | Main page background — near black |
| `--bg-surface` | `#13131A` | Cards, panels, elevated surfaces |
| `--bg-elevated` | `#1A1A24` | Hover states, dropdowns, modals |
| `--bg-sidebar` | `#0D0D14` | Sidebar navigation background |

### Borders

| Token | Hex | Usage |
|-------|-----|-------|
| `--border-subtle` | `#1E1E2A` | Default card borders |
| `--border-hover` | `#2A2A3A` | Hover state borders |
| `--border-active` | `#38BDF8` | Active/focused borders |

### Text

| Token | Hex | Usage |
|-------|-----|-------|
| `--text-primary` | `#F0F0F5` | Headlines, primary text |
| `--text-secondary` | `#8A8B9E` | Body text, descriptions |
| `--text-tertiary` | `#5A5B6E` | Timestamps, placeholders |
| `--text-muted` | `#4A4B5A` | Disabled, labels |

### Accents (mtsoln.com cyan/blue)

| Token | Hex | Usage |
|-------|-----|-------|
| `--accent-cyan` | `#38BDF8` | Primary accent — active nav, highlights, links |
| `--accent-blue` | `#5B5CFF` | CTA buttons, primary actions |
| `--accent-blue-hover` | `#4F4FE5` | CTA hover state |
| `--accent-cyan-glow` | `rgba(56,189,248,0.15)` | Glow effects behind active elements |

### Status Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `--status-success` | `#22C55E` | Positive sentiment, completed, success |
| `--status-warning` | `#F59E0B` | Neutral sentiment, pending, warning |
| `--status-error` | `#EF4444` | Negative sentiment, errors, alerts |
| `--status-info` | `#3B82F6` | Information, running, in-progress |

---

## Typography

| Purpose | Font | Weights | Usage |
|---------|------|---------|-------|
| **Headlines** | Inter | 700, 800 | Page titles, section headers |
| **Body & UI** | Inter | 400, 500, 600 | All body text, buttons, nav |
| **Data & Labels** | JetBrains Mono | 400, 500 | Stats, timestamps, tags, monospace labels |

### Scale

| Element | Size | Weight | Line-Height | Font |
|---------|------|--------|-------------|------|
| Hero Title | `clamp(1.75rem, 4vw, 3rem)` | 800 | 1.1 | Inter |
| Section Title | `clamp(1.25rem, 2.5vw, 1.875rem)` | 700 | 1.2 | Inter |
| Card Title | `1rem` | 600 | 1.3 | Inter |
| Body | `0.9375rem` | 400 | 1.6 | Inter |
| Body Small | `0.875rem` | 400 | 1.5 | Inter |
| Label / Tag | `0.6875rem` | 500 | 1 | JetBrains Mono (uppercase, tracking-wide) |
| Data Metric | `clamp(1.5rem, 3vw, 2.5rem)` | 700 | 1 | JetBrains Mono |
| Nav Item | `0.875rem` | 500 | 1 | Inter |

---

## Spacing

Base unit: `4px`. Use these tokens:

| Token | Value |
|-------|-------|
| `space-1` | `4px` |
| `space-2` | `8px` |
| `space-3` | `12px` |
| `space-4` | `16px` |
| `space-5` | `20px` |
| `space-6` | `24px` |
| `space-8` | `32px` |
| `space-10` | `40px` |
| `space-12` | `48px` |
| `space-16` | `64px` |

### Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `radius-sm` | `6px` | Tags, small buttons |
| `radius-md` | `8px` | Cards, inputs |
| `radius-lg` | `12px` | Panels, modals |
| `radius-xl` | `16px` | Featured cards |
| `radius-full` | `9999px` | Pill buttons, status dots |

---

## Component Design

### Top Navigation (Mobile-First)

**Desktop (≥1024px):**
- Fixed top bar, 56px height
- Background: `--bg-sidebar` with `backdrop-filter: blur(12px)`
- Bottom border: `1px solid --border-subtle`
- Left: Logo "RID" in JetBrains Mono + dot accent
- Center: Nav items — Dashboard, Weekly Plans, Agents
- Right: Settings icon + "New Plan" pill button (accent-blue)

**Mobile (<1024px):**
- Hamburger menu icon left
- Logo center
- Settings icon right
- Sheet/drawer slides in from left for nav
- Nav items stacked vertically with icon + label

### Card (mtsoln.com style)

- Background: `--bg-surface`
- Border: `1px solid --border-subtle`
- Border Radius: `radius-md`
- Padding: `space-5` (20px)
- No shadow — flat design with border definition
- Hover: border-color transitions to `--border-hover`, `translateY(-1px)`, `transition: 0.2s ease`
- Active/Selected: border-color `--accent-cyan`, subtle glow `box-shadow: 0 0 0 1px --accent-cyan-glow`

### Sidebar (Desktop Only, ≥1024px)

- Collapsible, 200px expanded / 64px collapsed
- Background: `--bg-sidebar`
- Right border: `1px solid --border-subtle`
- Nav items: icon + label, 40px height
- Active: left 2px border in `--accent-cyan`, bg `rgba(56,189,248,0.06)`, text `--accent-cyan`
- Hover: bg `rgba(255,255,255,0.03)`
- Bottom: "System Status" mini panel with online dot

### Pill Button (Primary CTA)

- Background: `--accent-blue`
- Text: white, 600 weight
- Border Radius: `radius-full`
- Padding: `space-2 space-5` (8px 20px)
- Hover: `--accent-blue-hover`, slight scale(1.02)
- Active: scale(0.98)

### Ghost Button

- Background: transparent
- Border: `1px solid --border-subtle`
- Text: `--text-secondary`
- Hover: bg `--bg-elevated`, border `--border-hover`

### Stat Block

- Vertical stack: large metric (Data Metric font) + small label (Label font)
- Metric color: `--text-primary`
- Label color: `--text-tertiary`
- Optional trend badge (small, colored)

### Badge / Status Tag

- Padding: `space-1 space-3` (4px 12px)
- Border Radius: `radius-full`
- Font: Label style (JetBrains Mono, uppercase, 0.6875rem)
- Active: bg `rgba(34,197,94,0.12)`, text `--status-success`, border `1px solid rgba(34,197,94,0.25)`
- Pending: bg `rgba(245,158,11,0.12)`, text `--status-warning`
- Error: bg `rgba(239,68,68,0.12)`, text `--status-error`
- Info: bg `rgba(59,130,246,0.12)`, text `--status-info`

### Input Field

- Background: `--bg-surface`
- Border: `1px solid --border-subtle`
- Border Radius: `radius-md`
- Height: 40px
- Padding: 0 `space-4`
- Text: `--text-primary`
- Placeholder: `--text-tertiary`
- Focus: border `--accent-cyan`, `box-shadow: 0 0 0 3px --accent-cyan-glow`

### Modal / Dialog

- Overlay: `rgba(0,0,0,0.7)` with `backdrop-filter: blur(4px)`
- Panel: bg `--bg-elevated`, border `1px solid --border-subtle`, radius `radius-lg`
- Max-width: 520px (mobile: 95vw)
- Entrance: scale 0.95→1, opacity 0→1, 0.2s ease

---

## Animation

| Name | Value | Usage |
|------|-------|-------|
| `ease-default` | `cubic-bezier(0.4,0,0.2,1)` | General transitions |
| `ease-decelerate` | `cubic-bezier(0.16,1,0.3,1)` | Card entrances |

- Card stagger: opacity 0→1, translateY 8px→0, stagger 0.05s, duration 0.3s
- Hover transitions: 0.2s ease
- Page transitions: fade 0.15s
- Mobile menu slide: 0.3s ease-decelerate

---

## Responsive Breakpoints

| Name | Width | Behavior |
|------|-------|----------|
| `mobile` | < 640px | Single column, full-width cards, bottom sheet modals, hamburger nav |
| `tablet` | 640–1023px | 2-column grids, hamburger nav, side sheets |
| `desktop` | ≥1024px | Sidebar nav, multi-column grids, hover interactions |

---

## Dependencies

- `framer-motion` — Animations
- `recharts` — Charts
- `lucide-react` — Icons
- `@fontsource-variable/inter` — Inter variable font
- `@fontsource/jetbrains-mono` — Mono font

---

## Key Design Principles (from mtsoln.com)

1. **Ultra-dark backgrounds** — Near-black creates premium feel
2. **Borders define hierarchy** — No shadows, use 1px subtle borders
3. **Cyan accent sparingly** — Only for active/focused states
4. **Blue pill CTAs** — Primary actions stand out with blue
5. **Monospace labels** — JetBrains Mono for tags, stats, timestamps
6. **Card-based layouts** — Information organized in bordered cards
7. **Mobile-first** — Hamburger nav, full-width cards, touch-friendly
8. **Flat design** — No gradients, no drop shadows, pure flat with borders
