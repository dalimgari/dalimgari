# Feature-based architecture

This project uses a gradual feature-based organization. Existing stable routes and services remain intact while feature code is migrated safely by domain.

## Domains

- auth
- website
- pages
- posts
- albums
- media
- users
- seo
- customization
- translation
- analytics
- audit
- backup

## Rules

1. Domain-specific UI, hooks, validation and orchestration belong under the domain feature.
2. Shared visual primitives belong in `src/components/ui`.
3. Shared layout belongs in `src/components/layout`.
4. Supabase access remains centralized in `src/services/supabase`.
5. Do not move or delete working modules without dependency verification and a passing production build.
