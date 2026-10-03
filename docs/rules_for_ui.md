# UI Design System and Frontend Guidelines (Rules for UI)

## Overview

This document defines the foundational UI/UX rules, design system tokens, color palettes, and workflow guidelines for the Daily Tracking application. Every new feature, page, modal, or component must adhere strictly to these principles.

---

## 1. Core UI Principles

1. **RTL-First & Typography**:
   - The application is designed primarily for Arabic text using the `Tajawal` font family (`sans-serif` fallback).
   - Base direction is `dir="rtl"` with proper text alignment and mirrored icon/padding placement.
2. **Solid Foundation & Consistency**:
   - Every interface must be built from the established CSS variables and design tokens in `style.css`.
   - Ad-hoc hardcoded hex values and inline styles are forbidden.
3. **Visual Depth & Hierarchy**:
   - Utilize multi-layered surfaces with soft cards, subtle borders, and calibrated elevation shadows.
   - Apply modern glassmorphism (`backdrop-filter: blur(...)`) to sticky headers and modal overlays.
4. **Interactive Polish**:
   - Interactive elements must provide immediate visual feedback (hover transitions, active scale states, smooth color shifts).
   - Standard transitions: `150ms` (fast) or `220ms` (base) using cubic-bezier timing.

---

## 2. Color Palette and Design Tokens

All tokens are defined in `style.css` under `:root`.

### 2.1 Backgrounds and Surfaces
| Variable | Value | Purpose |
| :--- | :--- | :--- |
| `--color-bg-page` | `#ffffff` | Main canvas background |
| `--color-bg-surface` | `#ffffff` | Card and component surfaces |
| `--color-bg-subtle` | `#f8fafc` | Subtle section backgrounds and alternate rows |
| `--color-bg-muted` | `#f1f5f9` | Inactive tabs, disabled states, pill badges |

### 2.2 Text Hierarchy (Slate Palette)
| Variable | Value | Purpose |
| :--- | :--- | :--- |
| `--color-text-primary` | `#0f172a` | High-contrast headings and primary labels |
| `--color-text-secondary` | `#475569` | Body text, descriptive labels, and subheaders |
| `--color-text-tertiary` | `#94a3b8` | Placeholders, timestamps, and muted captions |
| `--color-text-inverse` | `#ffffff` | Text on solid dark/primary backgrounds |

### 2.3 Primary Accent (Blue)
| Variable | Value | Purpose |
| :--- | :--- | :--- |
| `--color-blue-primary` | `#2563eb` | Primary CTAs, active states, key focal points |
| `--color-blue-hover` | `#1d4ed8` | Hover state for primary buttons |
| `--color-blue-active` | `#1e40af` | Active/pressed state |
| `--color-blue-light` | `#eff6ff` | Light blue badge and selection fill |
| `--color-blue-border` | `#bfdbfe` | Focus rings and active card borders |
| `--color-blue-glow` | `rgba(37, 99, 235, 0.15)` | Soft blue ambient focus/glow effect |

### 2.4 Metallic Gold Accent (Luxury Highlights)
| Variable | Value | Purpose |
| :--- | :--- | :--- |
| `--color-gold-base` | `#d4af37` | Premium badges, achievements, highlights |
| `--color-gold-deep` | `#b8860b` | Dark gold borders, high-contrast gold text |
| `--color-gold-light` | `#fef9c3` | Soft gold background tint |
| `--color-gold-border` | `rgba(212, 175, 55, 0.35)` | Gold element borders |
| `--gold-gradient` | `linear-gradient(135deg, #bf953f 0%, #fcf6ba 25%, #b38728 50%, #fbf5b7 75%, #aa771c 100%)` | Metallic gold badge and crown styling |
| `--gold-metallic-subtle` | `linear-gradient(135deg, rgba(212, 175, 55, 0.12) 0%, rgba(254, 249, 195, 0.2) 100%)` | Ambient gold card backgrounds |

### 2.5 Borders, Radii, and Shadows
- **Borders**:
  - `--color-border-subtle`: `#e2e8f0` (default dividing lines)
  - `--color-border-medium`: `#cbd5e1` (input borders)
  - `--color-border-focus`: `#2563eb` (focused input states)
- **Border Radii**:
  - `--radius-sm`: `8px` (small inputs, badges)
  - `--radius-md`: `12px` (buttons, normal inputs, standard tags)
  - `--radius-lg`: `16px` (cards, containers, modals)
  - `--radius-xl`: `20px` (large hero containers)
  - `--radius-pill`: `9999px` (pills, circular avatars)
- **Shadows**:
  - `--shadow-subtle`: `0 1px 3px rgba(15, 23, 42, 0.04), 0 1px 2px rgba(15, 23, 42, 0.02)`
  - `--shadow-card`: `0 4px 6px -1px rgba(15, 23, 42, 0.03), 0 12px 24px -4px rgba(15, 23, 42, 0.05)`
  - `--shadow-hover`: `0 8px 16px -2px rgba(15, 23, 42, 0.06), 0 2px 4px -1px rgba(15, 23, 42, 0.03)`
  - `--shadow-gold-sheen`: `0 4px 14px rgba(212, 175, 55, 0.2)`
  - `--shadow-blue-action`: `0 8px 20px rgba(37, 99, 235, 0.25)`

---

## 3. Impeccable Skill Integration

We utilize the `impeccable` skill (`.agent/skills/impeccable/SKILL.md`) for all design reviews, enhancements, refinements, and audits.

### 3.1 Operating Modes
1. **Operate (Daily Tracking App Core)**:
   - Primary mode for productivity dashboards, task lists, tracking boards, tables, and modal dialogs.
   - Focus: High scanability, rapid task completion, clean layout rhythm, clear states (empty, loading, error, success).
2. **Persuade**:
   - Used for landing sections, marketing banners, and onboarding value propositions.
3. **Read**:
   - Used for guides, documentation, help dialogs, and summaries.

### 3.2 Key Impeccable Commands and Workflows
- **`polish [target]`**: Final quality pass before shipping to refine spacing, optical alignments, contrast, and subtle micro-interactions.
- **`audit [target]`**: Checks technical quality, accessibility (contrast ratios, focus rings, keyboard navigability), responsive adaptivity, and performance.
- **`critique [target]`**: Evaluates visual hierarchy, information density, and UX flow against heuristic benchmarks.
- **`bolder [target]` / `quieter [target]`**: Calibrates visual energy (e.g. amplifying weak accents or toning down visual clutter).
- **`animate [target]`**: Implements smooth, hardware-accelerated transitions and subtle entry animations without causing layout shift.
- **`layout [target]`**: Adjusts spacing rhythms, margins, and flex/grid alignments.

---

## 4. Frontend Taste and Aesthetics Skills

To ensure our application avoids generic or default AI-slop patterns:
1. **Design Direction (`design-taste-frontend`, `high-end-visual-design`)**:
   - Treat UI as high-end craft with intentional spacing, crisp typography scales, and tailored shadows.
   - Avoid plain primary colors: use rich slate neutrals, royal blue accents, and metallic gold touches.
   - Ensure clean cards with generous padding (`20px - 32px`), distinct headers, and readable content.
2. **Typography Standards**:
   - Clear typographic hierarchy: Title (28px - 32px, bold), Section Header (20px - 24px, semi-bold), Body (14px - 16px, regular), Meta/Tag (12px - 13px, medium).
   - High readability with balanced line heights (1.4 for titles, 1.6 for body).
3. **Component Guidelines**:
   - **Buttons**: Pill or rounded-md shapes with micro-hover lift (`transform: translateY(-1px)`).
   - **Badges/Tags**: Light tint background with darker border and crisp text.
   - **Inputs**: Soft borders (`--color-border-medium`), smooth blue focus outlines with soft glow ring (`--color-blue-glow`).
   - **Modals & Drawers**: Backdrop blur with smooth fade/slide-up animation.

---

## 5. Summary Checklist Before Shipping Any UI

- [ ] RTL layout verified and text alignment correct for Arabic.
- [ ] Uses defined CSS variables from `style.css` (no ad-hoc hex colors).
- [ ] Hover and focus states implemented on all interactive components.
- [ ] Contrast meets accessibility standards (WCAG AA).
- [ ] Responsive behavior tested on mobile, tablet, and desktop viewports.
- [ ] Verified with `impeccable` audit or polish standards.
