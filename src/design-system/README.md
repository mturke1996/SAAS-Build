# `src/design-system/` — Tokens & Primitives

A small, opinionated design system. Everything here is brand-agnostic: tokens
read from CSS variables that `applyBrand` writes, so the system re-skins
instantly when the brand changes.

## Rules of the road

- **8px grid only.** Spacing values in `tokens/spacing.ts`. Never hand-pick pixel values.
- **Conservative radii.** `radii.md = 8px` is the default. `radii.xl = 16px` for modals/hero cards. No pill shapes outside badges.
- **Subtle shadows only.** No dramatic drop-shadows. See `tokens/shadows.ts`.
- **Motion budget: 150–300ms for UI.** Page wrappers may go up to 400ms, but children must stagger within the budget. See `tokens/motion.ts`.
- **Focus ring is brand-derived.** `var(--brand-focus-ring)` — `focus-visible:` gets it automatically.
- **Mobile-first.** Default layouts target ≤640px and progressively enhance.

## Tokens

| File | Exports |
|------|---------|
| `tokens/spacing.ts`    | 8px-grid scale |
| `tokens/radii.ts`      | `xs` through `xl`, `full` |
| `tokens/shadows.ts`    | `xs`..`xl`, `focus` |
| `tokens/typography.ts` | `size`, `weight`, `leading`, `tracking` |
| `tokens/motion.ts`     | `duration`, `ease`, `stagger` |
| `tokens/zIndex.ts`     | Single stacking source |

## Primitives (`primitives/`)

All primitives are thin Tailwind-powered React components, zero external deps:

| Component     | Purpose |
|---------------|---------|
| `Button`      | `primary / secondary / ghost / outline / danger`, sizes sm/md/lg, loading state, block |
| `IconButton`  | Accessible icon-only button with required `label` for a11y |
| `Input`       | Labeled input with optional left/right icons, hint, invalid state |
| `Card`        | Panel with optional header block (leading icon + title/description + trailing) |
| `Surface`     | Generic panel (variants: panel/raised/sunken/canvas) |
| `Stack`       | Flex container with 8px-grid gap tokens |
| `Badge`       | Pill/tag — neutral/brand/success/warning/danger/info; solid or subtle |
| `Modal`       | Portaled dialog, backdrop blur, ESC to close, GSAP scale-in |

## Theme bridges (`theme/`)

| File | Role |
|------|------|
| `applyBrand.ts`      | Writes CSS variables from `BrandConfig` to `:root` |
| `createMuiBridge.ts` | Builds a MUI theme from the active brand |

## Using with Tailwind

`tailwind.config.js` maps brand CSS variables into semantic utilities:

```
bg-surface-panel         # --surface-panel
text-fg-subtle           # --text-secondary
bg-brand-success         # --brand-success
text-[color:var(--brand-primary)]  # explicit when you need the raw var
shadow-focus             # --brand-focus-ring
```

## Extending

- New primitive? Add to `primitives/` and export from `primitives/index.ts`.
- New token? Add to `tokens/`, export from `tokens/index.ts`, then (optionally) expose via `applyBrand.ts` and Tailwind config.
