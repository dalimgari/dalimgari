# Safe Improvement Plan — 2026-10-13

## Objective

Improve the Dalimgari project against the existing priorities, in this order:

1. Security & Safety
2. Fast & Reliable
3. Usable & Clean

This plan is intentionally incremental. It is not authorization to replace the frontend framework, alter production data, weaken authorization, or deploy unverified behavior.

## Baseline observations

- The current production frontend is static HTML, CSS, and JavaScript hosted on GitHub Pages.
- `index.html` mounts `header.html` and `footer.html`, then loads `app.js` and `header.js`.
- `home.html` defines homepage sections; existing application code handles data integration and rendering.
- `app.js` is approximately 263 KiB (268,544 bytes). File size alone does not establish a performance defect.
- `package.json` provides JavaScript syntax checks and Node's built-in test runner through `npm run check`.
- `.github/workflows/performance-audit.yml` can collect three mobile Lighthouse reports, but is manually triggered.
- Earlier production audit notes identify work that requires separate evidence or dashboard access: leaked-password protection, browser-level performance measurements, authenticated end-to-end testing, and migration-history reconciliation.

## Phase 1 — Baseline and safety

1. Preserve `main`; conduct changes on a dedicated branch.
2. Run the existing quality workflow and retain its result.
3. Run the three-pass mobile Lighthouse audit and retain the artifact.
4. Record baseline FCP, LCP, TBT, CLS, Speed Index, and performance score; do not claim improvement without comparable measurements.
5. Review the browser request waterfall to distinguish JavaScript execution, Supabase latency, layout, and media transfer.
6. Keep production Supabase schema, RLS, Auth settings, Storage policies, and Edge Function deployments unchanged during this baseline phase.

## Phase 2 — Targeted fixes

After baseline evidence, prioritize confirmed defects. Prefer small changes that can be tested and reverted independently. Start with unnecessary serial network work, repeated Supabase requests, avoidable rendering, and oversized or eagerly loaded media only where measurements confirm the issue.

## Phase 3 — Maintainability improvements

- Add formatting and lint checks without mass-reformatting existing files.
- Split `app.js` into cohesive modules incrementally, preserving selectors, event order, routes, and existing behavior.
- Introduce TypeScript for new or migrated modules only after the build/test path is established.
- Evaluate Vite and a component framework through an isolated pilot, not a wholesale rewrite.
- Add browser regression tests for homepage rendering, albums/order, themes, authentication, permissions, and media access before broad migration.

## Mandatory safeguards

- Never put a Supabase service-role key in browser code.
- Never weaken RLS, Storage authorization, role checks, or Edge Function JWT verification to make a test pass.
- Do not replay unmatched historical migrations, edit the production migration ledger, or drop indexes/triggers without reviewed evidence and a tested recovery path.
- Do not remove or rename existing files until all references and deployment paths are verified.
- Keep production changes behind review and passing checks; preserve a clear rollback point.

## Completion criteria

- A repeatable baseline report exists.
- Existing automated checks pass.
- Each optimization has before/after measurements and regression evidence.
- Security-sensitive behavior is tested separately from performance changes.
- No production change is considered complete based only on source inspection.
