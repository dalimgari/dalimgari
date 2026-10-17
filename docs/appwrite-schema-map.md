# Appwrite migration schema map

This is a planning artifact derived from a fresh read-only inventory of the active Supabase project. It is **not** an applied Appwrite schema and contains no production credentials.

## Current relational inventory

All 16 public tables were reported with Row Level Security enabled. Current row counts are a point-in-time inventory and may change.

| Current Supabase table | Observed rows | Appwrite target | Migration notes |
|---|---:|---|---|
| `profiles` | 1 | `profiles` | Preserve user identity mapping; profile ID currently references Supabase Auth user UUID. |
| `albums` | 0 | `albums` | Preserve unique URL/slug, visibility, bilingual fields, and media references. |
| `post` | 0 | `posts` | Preserve custom URL, visibility, album relationship, and bilingual content fields. |
| `hero_items` | 0 | `hero_items` | Preserve public/private visibility and media metadata. |
| `roles` | 3 | `roles` | Recreate roles before role assignments. |
| `permissions` | 9 | `permissions` | Keep permission identifiers stable where possible. |
| `user_roles` | 1 | `user_roles` | Map old Auth IDs to Appwrite user IDs; never assume IDs match. |
| `role_permissions` | 11 | `role_permissions` | Recreate after roles and permissions. |
| `site_customizations` | 0 | `site_customizations` | Preserve setting keys and values. |
| `site_settings` | 0 | `site_settings` | Preserve public/private read policy. |
| `recycle_bin` | 0 | `recycle_bin` | Preserve restore metadata and 30-day retention behavior. |
| `pages` | 4 | `pages` | Preserve HTML, URL, visibility, and any album relationship. Sanitize managed HTML on rendering. |
| `widgets` | 2 | `widgets` | Preserve widget type, configuration, and visibility. |
| `media_assets` | 0 | `media_assets` | Central media library; preserve title, file metadata, and storage mapping. |
| `media_links` | 0 | `media_links` | Rebuild references only after media assets are mapped. |
| `edge_function_secrets` | 0 | **Do not migrate values blindly** | Inventory the schema only. Rotate/recreate secrets in Appwrite Function environment variables; never export secret values into source control. |

## Identity and authorization

- Supabase Auth identities are not automatically portable to Appwrite. User IDs and password hashes must not be assumed compatible.
- Design an explicit old-user-ID → Appwrite-user-ID mapping. Test account recovery / password reset before cutover.
- Appwrite row and file permissions must be configured explicitly. Supabase RLS policies do not translate automatically.
- The protected super-admin account must be provisioned and tested separately before normal user import. Prevent privilege escalation server-side; never trust client-provided roles.
- Do not expose `APPWRITE_API_KEY` to the browser. Use a least-privilege server-side key and keep it out of logs and Git.

## Storage mapping

The latest prior inventory identified profile pictures, hero images, and content files in Supabase Storage. Re-scan exact bucket/file counts and visibility immediately before export. Copy bytes and metadata, verify hashes and access rules, and only then update database references. Do not delete source files during migration.

## Cutover acceptance gates

1. Appwrite project, database, buckets, and server-only API key are provisioned.
2. Schema, indexes, and permissions are applied to a non-production environment.
3. Export/import counts reconcile for every table; storage files pass hash and access checks.
4. Auth, protected super-admin, role/permission boundaries, uploads, pages, albums, recycle-bin restore/expiry, widgets, and map-link resolution pass tests.
5. Production build, lint, type-check, route smoke tests, and authorization tests pass against the Appwrite staging project.
6. Vercel preview has required environment variables and passes end-to-end tests.
7. Rollback procedure is verified. Only then schedule production cutover; retain Supabase intact through the agreed rollback window.
