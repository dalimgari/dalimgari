# React + TypeScript Migration Plan

## Current status: isolated preview scaffold

The React/Vite/TypeScript application is available through `react-preview.html` on this feature branch. The Vite build targets this preview only. Production `index.html`, legacy JavaScript/CSS, Supabase migrations, and the GitHub Pages deployment workflow remain unchanged.

## Implemented in this phase

- React + TypeScript + Vite configuration and strict type checking.
- Shared React header/footer, app shell, router, modal, album card, and image viewer components.
- CSS design tokens and accessible baseline styles.
- Optional Supabase browser client configured only from public `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` variables.
- Unit smoke tests, a Playwright preview test, and a pull-request CI workflow.
- Migration safety rules and a backup branch.

## Required before production cutover

1. Generate and commit a lockfile from the supported Node/npm environment.
2. Run CI and fix all failures; run the Playwright test with installed browser binaries.
3. Inventory all existing routes, homepage sections, DOM IDs/selectors, auth and role flows, Supabase queries, album ordering, upload/delete, theme behavior, accessibility, and mobile interactions.
4. Port each feature incrementally into `src/features/*`, with typed service adapters and regression tests.
5. Generate `Database` types from the actual Supabase schema. Do not guess table definitions or change live policies to accommodate frontend code.
6. Verify RLS and Storage access against test accounts. Never ship a service-role key in browser assets.
7. Confirm the Vite base path and deep-link behavior for GitHub Pages. The production deployment workflow must not publish `dist/` until the build includes all required assets and passes parity tests.
8. Run preview/browser smoke tests for homepage, login/logout, dashboard saves, gallery/media access, album ordering, and mobile navigation.
9. Rehearse rollback to the known-good backup before changing the production entry point.

## Non-negotiable safety constraints

- Do not replace production `index.html` in one large rewrite.
- Do not modify Supabase schema, Auth settings, RLS, Storage policies, or Edge Functions as part of this frontend scaffold.
- Do not treat a successful static build as proof of production feature parity.
