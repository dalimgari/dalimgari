# Legacy-to-React Feature Parity Inventory

This inventory is based on the existing `app.js` and `index.html` in this branch. It is a migration checklist, not proof that the React implementation already contains these features.

## Current React preview coverage

| Area | Status | Notes |
|---|---|---|
| Shared shell | Partial | React header, footer, app shell, preview-only router |
| Public albums | Partial | Public query, signed cover URL, visibility/media filter, configured ordering |
| Album carousel | Partial | Single DOM list, manual controls, auto-scroll, reduced-motion guard |
| Modal | Component only | Keyboard close, focus containment and restoration |
| Homepage hero and page sections | Not ported | Legacy dynamic sections and site customization still need parity |
| Public pages and gallery | Not ported | Dynamic page URL and gallery behavior not migrated |
| Authentication/profile | Not ported | Only service-level auth helpers exist |
| Dashboard | Not ported | Legacy dashboard contains role-aware sections and CRUD |
| Media Library | Not ported | Upload, metadata, attachment, detach, delete workflows remain legacy-only |
| Production deployment | Intentionally unchanged | React preview is not the production entry point |

## Existing public content and customization behavior

- Public albums: `albums` with `visibility = public`, ordered by `created_at DESC`; homepage order is stored in `site_customizations` under `home_album_order`.
- Public posts/pages/hero items: `post`, `pages`, and `hero_items`, filtered by visibility.
- Homepage page pills: public rows from `pages`; ordering uses `site_customizations.home_page_order`.
- Page-pill auto-scroll: `site_customizations.home_page_pill_autoscroll`.
- Homepage hero fallback and general appearance: `site_customizations` keys including `home_hero` and other UI customization keys.
- Homepage inclusion/card/widget behavior reads page content, public content rows, `widgets`, and site customization records. These are not yet ported to React.

## Existing route and auth surface

- Home, Login, Logout, CreateAccount, ForgotPassword, Profile, EditProfile, Dashboard.
- Dynamic public pages are resolved by the `pages.url` value; homepage page cards and included page content depend on that URL behavior.
- Auth uses Supabase password sign-in, session state, registration policy configuration, profile lookup, and role-aware Dashboard access.
- Dashboard sections: Overview, Hero, Post, Page, Album, Media Library, Widget, User, Role, Customization, Settings, Recycle Bin.
- Non-admin dashboard access relies on the `get_my_permissions` RPC and permission names such as `content.view`, `content.create`, `content.edit`, `content.delete`, `users.manage`, `roles.manage`, and `settings.manage`. These checks must remain enforced by backend policies/RPCs.

## Existing storage and data dependencies

- Tables observed in legacy queries: `albums`, `post`, `pages`, `hero_items`, `site_customizations`, `widgets`, `profiles`, `media_assets`, `media_links`, `recycle_bin`, `permissions`, `role_permissions`, `user_roles`, and `roles`.
- Storage buckets observed: `content-files` and `profile-pictures`.
- The legacy media library associates reusable files with content through `media_assets` and `media_links`; permanent deletion must account for attachments and existing Storage policies.
- The browser client may use the public anon/publishable key only. Never move a service-role key into frontend code.

## Release gates

- [ ] Lockfile committed; CI uses `npm ci`.
- [ ] Supabase database types generated from the live schema.
- [ ] Every feature above implemented with matching URL/state behavior.
- [ ] Auth and role tests pass with test accounts for each role.
- [ ] RLS and Storage policies verified without weakening access controls.
- [ ] E2E tests cover homepage, gallery, profile, dashboard CRUD, media lifecycle, and mobile/keyboard interactions.
- [ ] GitHub Pages base/deep links validated.
- [ ] Backup and rollback rehearsed.
- [ ] Production deployment remains on legacy until all gates pass.
