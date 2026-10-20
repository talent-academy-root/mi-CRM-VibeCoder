# Vibe CRM — Design System

A portable design system for **Vibe CRM**, a CRM for a small digital-sales business. Mobile-first, PWA-oriented, Spanish-language UI. Visual DNA inspired by **Stripe, Attio and Linear**: precise, lots of air, impeccable typography, restrained colour.

> **Source:** authored from the `design.md` spec supplied by the user (the full text of which drives every token and component here). No external codebase or Figma was provided — this README is the source of truth alongside the token CSS.

## Who it's for

Two users shape every decision:
- **Marta**, owner, ~45, not very technical → needs clarity, comfortable sizes, zero ambiguity.
- **Carlos**, sales, ~28, heavy mobile user → needs speed and high information density.

Personality: **professional, trustworthy, energetic**. When in doubt, prioritise in this order: **1. Solidity & trust · 2. Simplicity & legibility (one main idea per screen) · 3. Speed.**

Design mantras:
- The green **earns its place** — primary actions, active state, focus. Never decorative filler.
- **One primary action per view.**
- Separate with **1px borders + very subtle shadows**, not heavy elevation.
- Light-grey canvas + white cards = the base of every composition.
- Figures always in **tabular mono**, right-aligned.

---

## CONTENT FUNDAMENTALS

- **Language:** Spanish (España). UI copy, labels, empty states and errors are all in Spanish.
- **Voice:** professional, calm, energetic. Plain business language, no jargon, no hype. Addresses the user implicitly (imperatives like "Añadir contacto", "Guardar", "Ver todo") rather than "tú/usted" pronouns.
- **Casing:** Sentence case for everything — titles, buttons, labels ("Nuevo contacto", not "Nuevo Contacto"). Minor eyebrow labels are UPPERCASE with `.06em` tracking ("6 CONTACTOS").
- **Buttons/CTAs:** short verb-first phrases — "Guardar", "Añadir contacto", "Llamar", "Ver todo", "Entendido".
- **Status vocabulary (deals):** Ganado · Pendiente · Perdido · Nuevo lead · En negociación · Borrador.
- **Numbers & money:** Euro, Spanish formatting (`€48.250`, `€12.400`), thousands with a dot. Always mono tabular and right-aligned in lists/tables.
- **Tone in empty/error states:** helpful and brief — one title line + one help line + one action. E.g. "Sin contactos todavía" / "Añade tu primer contacto para empezar a vender."
- **No emoji.** Ever. The interface is data-first and sober.

---

## VISUAL FOUNDATIONS

- **Colour:** restrained. A grey cool-neutral canvas (`#F7F8F9`) with white surfaces (`#FFFFFF`); a single brand green (`#16A34A`, green-600) reserved for primary action, active and focus. State colours (success/warning/error/info) appear only in badges, deltas and validation. Use **semantic tokens only** — raw scales exist to build semantics or for charts.
- **Imagery:** essentially none — data-first. **No photos.** Avatars are **initials** on `primary-subtle`. Icons carry all visual texture.
- **Type:** Inter for all text; **JetBrains Mono** (tabular-nums) for every figure, amount and table number, right-aligned. Weights 400/500/600 — **avoid 700**. Titles & general text carry `-0.011em` tracking; minor labels use UPPERCASE + `.06em`.
- **Spacing & layout:** strict 8px base scale (4·8·12·16·20·24·32·40·48·64). Flex/grid with `gap`, never loose margins. Desktop content max 1200px, centred.
- **Shape / corners:** general radius **6px**; cards & modals **10px**; pills/avatars **full**. Inputs/buttons 6px.
- **Borders:** a 1px `--color-border` (`#E8EAED`) is the *primary* means of separation; controls use the stronger `#D8DBDF`.
- **Shadows:** **very subtle**, cool-tinted (`rgba(16,24,32,…)`). `xs`/`sm` for cards, `md` for popovers, `lg` for sheets/modals. Cards sit on `xs` + a 1px border — never a heavy drop shadow.
- **Cards:** white surface, 1px border, 10px radius, `shadow-xs`, 20px padding; optional header = 15px/600 title + a primary-green text action.
- **Backgrounds:** flat. **No gradients, no textures, no patterns, no blur** as decoration. (Blur/transparency only for true overlay scrims if needed.)
- **Animation:** fast and subtle — `150ms` with `cubic-bezier(0.2,0,0,1)`. No bounces, no long or looping animations. Loading = skeleton pulse (opacity 1↔.45, 1.4s) or a thin spinner.
- **Hover:** primary darkens to `-hover`; secondary/ghost gain a `surface-2` fill. **Press:** primary → `-active` + optional `translateY(1px)`.
- **Focus:** always visible — a 2px green ring with a surface-coloured gap: `0 0 0 2px var(--color-surface), 0 0 0 4px var(--color-focus)`.
- **Density:** adaptive — comfortable on mobile (48px controls), compact in desktop tables (44px). Min touch target 44×44px.
- **Dark mode:** opt-in via `data-theme="dark"`; only the semantic tokens are redefined (green brightens to `#22C55E`, canvas `#0E0F11`).

---

## ICONOGRAPHY

- **Library:** [Lucide](https://lucide.dev) — 1.5px stroke, `stroke="currentColor"`, sizes 16 / 20 / 24px (22px in the tab bar).
- **Form:** outline SVG only. No filled icons, no icon font, **no emoji**, no unicode glyphs as icons.
- **In this system:** the UI kit ships a small `ui_kits/vibe-crm/icons.jsx` containing the exact Lucide path data for the glyphs used (Home, Users, TrendingUp, BarChart, Search, Bell, Phone, Mail, Building, Calendar, Plus, chevrons, etc.). For new work, pull additional icons from Lucide (CDN or the React package) at the same 1.5px weight — do not hand-draw substitutes or mix in another icon set.
- **Avatars** stand in for imagery: initials derived from the name, primary-green on `primary-subtle` (or neutral grey).

---

## INDEX / manifest

**Root**
- `styles.css` — global entry point (consumers link this). `@import`s only.
- `base.css` — element resets, `.tnum` helper, shared `@keyframes` (spin, pulse).
- `tokens/` — `colors.css`, `typography.css`, `spacing.css`, `effects.css`, `fonts.css` (Inter + JetBrains Mono via Google Fonts).
- `SKILL.md` — Agent-Skill wrapper for downloading/using this system in Claude Code.

**Components** (`components/<group>/` — React primitives, one `.jsx` + `.d.ts` + `.prompt.md` each)
- `core/` — **Button**, **IconButton**, **Card**, **Metric** (KPI), **ListRow**
- `forms/` — **Input**
- `feedback/` — **Badge**, **Avatar**, **Skeleton**, **EmptyState**
- `navigation/` — **TabBar** (mobile bottom nav)

**Foundation cards** (`guidelines/*.card.html`) — colour (primary, neutrals, state, dark), type (scale, mono), spacing (scale, radii & shadows). These populate the Design System tab.

**UI kit** (`ui_kits/vibe-crm/`) — interactive mobile app recreation: `index.html` (app shell + tab nav + FAB), `HomeScreen` (dashboard/KPIs/activity), `ContactsScreen` (searchable list), `DealScreen` (contact + deal detail), plus `icons.jsx` and `data.jsx`.

> Use the **semantic** tokens, one primary action per view, mono tabular figures, 48px controls, a visible green focus ring, Lucide icons, 8px spacing — and check `design.md`'s screen checklist before shipping a screen.
