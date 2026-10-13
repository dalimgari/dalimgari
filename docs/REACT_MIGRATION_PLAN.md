# React + TypeScript Migration Plan

## Status: scaffold only — not production activated

This branch introduces a React/Vite/TypeScript foundation alongside the existing static application. The current `index.html`, `home.html`, `app.js`, layout fragments, deployment workflow, Supabase migrations, and production behavior are intentionally not replaced in this step.

## Required migration sequence

1. Capture and retain a known-good baseline (backup branch created before scaffold work).
2. Install dependencies and generate a lockfile using the repository's supported Node/npm versions.
3. Run existing Node tests and record baseline results.
4. Inventory all legacy routes, page sections, DOM IDs/selectors, Supabase calls, authentication/roles, album ordering, media upload/delete, themes, and mobile interactions.
5. Port one feature at a time into `src/features/*`; keep data access in typed service adapters.
6. Generate database TypeScript types from the actual Supabase schema. Do not infer schema or alter live policies during frontend migration.
7. Add unit/integration and Playwright coverage for each ported feature.
8. Validate Vite's output paths and GitHub Pages deep-link behavior. Do not point production deployment at `dist/` until the built site passes checks.
9. Run a staging/preview smoke test for login, homepage rendering, dashboard saves, media upload/access, album ordering, and mobile interactions.
10. Switch the production entry point only after parity checks pass and rollback has been rehearsed.

## Safety constraints

- No production HTML/JavaScript entry point is changed by the scaffold.
- No Supabase database, Storage, RLS, Auth, or Edge Function settings are changed here.
- Never put service-role credentials in browser code.
- Keep the existing GitHub Pages deployment workflow unchanged until the Vite build and asset routing are verified.
