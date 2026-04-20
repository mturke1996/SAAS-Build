# SAAS-Build

A premium, white-label SaaS workspace. Mobile-first, RTL/LTR-ready, Firebase-powered, deployable on Vercel in one click.

> Clone it. Re-theme it. Ship it.

## Highlights

- React 18 + TypeScript + Vite -- modern, fast, type-safe
- Tailwind CSS + MUI v7 -- design-system primitives with a legacy bridge
- Dynamic white-label engine -- brand name, logo, colors, Firebase config all swappable at runtime
- GSAP motion with @gsap/react for cleanup-safe animation
- Firebase Auth + Firestore (per-tenant config)
- PWA -- add to iPhone home screen for a native-app feel
- Arabic RTL first-class (Tajawal font) with English LTR support
- Mobile-first with iOS safe-area handling, 44px+ touch targets
- 10+ business modules: invoices, clients, payments, expenses, debts, letters, fund, users

## Architecture

```
src/
  config/          BrandConfig + BrandProvider + firebase.ts
  design-system/   tokens (8px grid) + primitives + MUI bridge
  core/            motion (GSAP), agent, memory, hooks, utils
  stores/          Zustand (auth, data, brand, theme, app-lock, fund)
  services/        Firebase CRUD services
  features/        pdf/ + print/ (brand-driven)
  ui/              shells, nav, brand, feedback, pages, pages-legacy
  types/
```

## Run locally

```
npm install
npm run dev
```

Open http://localhost:3000

## White-label in 30 seconds

Option A -- in the app: sign in, open /settings/branding, live-edit name, logo, colors, Firebase config. Changes apply instantly and persist per browser.

Option B -- env vars (recommended for production). Create `.env.local`:

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_MEASUREMENT_ID=...
```

Env vars always win over the in-app override or the compiled default.

Option C -- baked-in default: edit `src/config/brand.config.ts` and rebuild.

## Deploy to Vercel

1. Push this repo to GitHub.
2. Go to https://vercel.com/new and import the repo.
3. Framework preset: Vite (auto-detected).
4. Build command: `npm run build` -- Output directory: `dist`.
5. Add the 7 env vars above under Settings / Environment Variables.
6. Deploy.

SPA rewrites and cache headers are pre-configured in `vercel.json`.

## Deploy Firestore rules

```
npm install -g firebase-tools
firebase login
firebase deploy --only firestore:rules
```

## Preserved modules

| Module    | Route                                         |
| --------- | --------------------------------------------- |
| Dashboard | /                                             |
| Clients   | /clients, /clients/:id                        |
| Invoices  | /invoices, /invoices/new, /invoices/:id       |
| Payments  | /payments                                     |
| Expenses  | /expenses                                     |
| Debts     | /debts                                        |
| Fund      | /fund                                         |
| Letters   | /letters                                      |
| Users     | /users                                        |
| Branding  | /settings/branding                            |

PDF generators (invoice, letter, client reports) are fully brand-driven.

## License

MIT.
