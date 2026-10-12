# Dalimgari Architecture and Modernization Plan

## Goals

The project must remain secure, fast, reliable, usable, maintainable, and ready to grow. Existing user-facing behavior and Supabase data/permissions are compatibility requirements, not disposable implementation details.

## Current production shape

- Static HTML/CSS/JavaScript frontend deployed to GitHub Pages.
- `index.html` provides the shared header, main content area, and footer.
- `home.html` describes homepage sections; `app.js` owns the existing application behavior.
- Supabase provides authentication, PostgreSQL, Row Level Security (RLS), Storage, and Edge Functions.
- GitHub Actions deploys the static site.

## Target direction

1. **TypeScript** for new application logic and gradually migrated code.
2. **React + Vite** for a component-based frontend, introduced incrementally after automated checks and behavior baselines exist.
3. **Supabase remains the default backend** while it meets requirements. Keep data access behind a small, typed application/data layer rather than scattering query logic through UI components.
4. **NestJS is optional and separately hosted.** Add it only when server-side business logic, integrations, background work, or API needs justify another service. GitHub Pages cannot execute a NestJS server.
5. **Automated verification** with Node-based checks first, followed by focused unit/integration tests and Playwright browser flows.
6. **Observability and performance budgets** for JavaScript size, Core Web Vitals, failed requests, and Supabase query latency.
7. **Controlled database changes** using reviewed migrations, explicit RLS policy checks, and a documented recovery procedure.

## Non-negotiable migration rules

- Do not replace the production frontend in one large rewrite.
- Preserve routes, IDs/selectors used by the existing application, authentication behavior, roles, album ordering, media handling, theme behavior, accessibility, and mobile interactions.
- Never put Supabase service-role keys or other server secrets in browser assets.
- Do not weaken RLS or storage policies to make a feature work.
- Do not apply destructive database migrations without reviewing their impact and recovery plan.
- Make changes on a feature branch; require checks to pass before merging to `main`.
- Keep a known-good rollback point before substantial changes.
- Treat passing static checks as necessary but not sufficient: browser regression and production smoke tests are still required.

## Incremental roadmap

### Phase 0 — Baseline and guardrails
- Preserve a known-good Git commit.
- Add automated JavaScript syntax and structural regression checks.
- Add a pull-request quality workflow.
- Record unresolved live-browser and Supabase verification tasks.

### Phase 1 — Audit and stabilize
- Measure the actual `index.html` and `home.html` loading path with browser network/performance data.
- Audit RLS, storage policies, Edge Function authorization, dependency sources, and client-side input/output handling.
- Add tests for login, homepage rendering, album/gallery flows, dashboard writes, and role boundaries.

### Phase 2 — Modern frontend foundation
- Introduce Vite and TypeScript in a separate build path.
- Migrate one low-risk UI component to React as a pilot.
- Compare behavior and performance against the current production version.
- Expand only when the pilot passes regression and performance checks.

### Phase 3 — Gradual application migration
- Move page sections and shared UI incrementally.
- Centralize typed Supabase access and validation.
- Keep the production site on the known-good deployment until parity is demonstrated.

### Phase 4 — Backend expansion only when justified
- Evaluate NestJS against concrete requirements and operational cost.
- Host it separately, use server-side secrets, and enforce authorization on every privileged operation.
- Retain Supabase RLS as a database-level protection layer.

### Phase 5 — Operational maturity
- Add Playwright browser tests, error monitoring, performance budgets, dependency auditing, and tested restore procedures.
- Consider PWA/offline behavior only with a clear cache invalidation and data synchronization strategy.

## Current status

The first quality baseline is intentionally dependency-free. It protects important structural contracts without changing the production runtime. Passing these checks does not prove the site works in a real browser; manual/browser smoke tests remain necessary.
