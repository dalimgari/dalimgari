# React + TypeScript Migration Plan

## Current status: isolated migration preview — not production-ready

The React/Vite/TypeScript application is available through `react-preview.html` on this feature branch. The Vite build targets this preview only. Production `index.html`, legacy JavaScript/CSS, Supabase migrations and policies, and the GitHub Pages deployment workflow remain unchanged.

## Implemented

- React + TypeScript + Vite configuration and strict type checking.
- Isolated preview routing that works when loaded from `/react-preview.html`.
- Shared React header/footer, app shell, modal, album card, and image component.
- Modal keyboard handling: Escape to close, Tab focus containment, and focus restoration.
- CSS design tokens, responsive layout, visible focus styles, and reduced-motion support.
- Supabase browser client uses only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`; `.env.example` documents those public browser settings. Never put a service-role/secret key in a `VITE_*` variable.
- Public album query follows the existing table/column names, filters out albums without media, signs media URLs from the existing `content-files` bucket, respects the `home_album_order` customization, and renders one non-duplicated horizontal carousel with manual controls and a reduced-motion guard.
- Unit smoke checks and Playwright browser smoke checks run in GitHub Actions.

## Required before production cutover

1. Generate and commit a lockfile from the supported Node/npm environment; then use `npm ci` in CI.
2. Generate complete `Database` types from the actual Supabase schema. The current hand-written types cover only a small set of read columns and are not authoritative.
3. Port and regression-test the homepage hero, public page pills and page ordering, post/page/hero content cards, widgets, custom HTML pages, theme/customization settings, and all configured homepage behavior.
4. Port authentication end-to-end: login, registration policy, forgot/reset password, session restoration, logout, profile display/edit, avatar handling, and error/rate-limit states.
5. Port all Dashboard sections: overview, hero, post, page, album, Media Library, widget, user, role/permissions, customization, settings, and recycle bin. Preserve the existing server-side/RPC permission checks; hiding UI is not authorization.
6. Port gallery navigation, media viewer behavior, file upload/replace/delete, media attachments, profile pictures, and album ordering. Keep one record per album and do not duplicate cards to simulate looping.
7. Verify RLS and Storage access using separate anonymous, ordinary-user, content-manager, and administrator test accounts. Do not modify live policies merely to make the frontend pass.
8. Add E2E regression tests for public homepage sections, deep links, auth, dashboard permission boundaries, CRUD, media upload/delete, album ordering, mobile navigation, keyboard accessibility, and failed/offline Supabase requests.
9. Confirm GitHub Pages base path and deep-link behavior. The deployment workflow must not publish the preview or `dist/` until all feature parity checks pass.
10. Rehearse rollback to the known-good backup before any production entry-point change.

## Non-negotiable safety constraints

- Do not replace production `index.html` in one large rewrite.
- Do not modify Supabase schema, Auth settings, RLS, Storage policies, or Edge Functions as part of this frontend migration without a separately reviewed change.
- Do not claim production feature parity from a successful static build.
