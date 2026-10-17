# Dalimgari — Full-Stack Dynamic Web Application

Next.js App Router, React, TypeScript, and Supabase.

## Requirements

- Node.js 22.12 or newer
- npm
- Supabase project URL and publishable key

## Local development

1. Copy `.env.example` to `.env.local`.
2. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
3. Run `npm ci`.
4. Run `npm run dev`.

Never paste secrets into ChatGPT or commit local environment files. Do not use a Supabase service-role key in browser code.

## Quality checks

- `npm run lint`
- `npm run typecheck`
- `npm run build`

GitHub Actions runs all three checks on the rebuild branch and pull requests. Dependencies are pinned and the npm lockfile is committed.

## Current application features

- Responsive Next.js shell with role-aware navigation
- Supabase SSR session refresh and secure callback flow
- Login, signup, password reset, and protected profile
- Server-protected Admin dashboard and live counts
- Database-managed public pages, server-side HTML sanitization, page editor, and private-page visibility rules
- Page Recycle Bin with atomic restore and 30-day expiry
- Public album/gallery routes driven by public media relationships
- Media Library with explicit title, public/private visibility, file type/size checks, SHA-256 duplicate detection, and private storage paths
- Baseline security headers, privacy page, and health endpoint

## Roles

- Guest: unauthenticated visitor; can read only public content.
- Member: authenticated account; assigned the member role by the database trigger.
- Admin: explicitly trusted account with server-verified app metadata and database RBAC assignment.

Never assign Admin based on user-editable profile metadata. RLS and server-side checks remain authoritative.

## Free-tier and privacy constraints

The current Supabase organization is on the Free plan. Free tiers have quotas and may pause idle projects or change their terms. A Vercel connection is needed for deployment; a custom domain may cost money, so use a provider subdomain to stay at zero cost. Hosting/database providers necessarily process technical data. The application does not intentionally add advertising or analytics.

## Deployment

The application requires a host that supports the Next.js server runtime. GitHub Pages alone cannot run the server routes and Server Actions used here. Set the two public Supabase environment variables in the hosting provider's environment settings; never commit them.

## Database migrations

New migrations are tracked under `supabase/migrations`. The existing Supabase project has a longer legacy migration history than the new rebuild branch, so this branch is not yet a complete clean-room database bootstrap. Do not point a fresh production project at it until a full schema/policy/function/storage baseline is exported and verified.

## Development policy

The rebuild is isolated on `rebuild/nextjs-foundation`; `main` is not replaced by this work. Production deployment remains blocked until role-based integration tests, Auth security settings, storage permissions, and restore/backup procedures are verified.
