# Dalimgari — Full-Stack Dynamic Web Application

Dalimgari is a Next.js App Router application built with React, TypeScript, and Supabase.

## Production website

**Open:** https://dalimgari.vercel.app/

The legacy GitHub Pages address redirects visitors to the production website. GitHub Pages cannot run the Next.js server routes and Server Actions used by this application; Vercel is the application host.

## Stack and requirements

- Node.js 22.12 or newer
- npm
- Next.js App Router, React, TypeScript
- Supabase Auth, PostgreSQL, and Storage

## Local development

1. Copy `.env.example` to `.env.local`.
2. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
3. Run `npm ci`.
4. Run `npm run dev`.

Never paste secrets into ChatGPT or commit local environment files. Never use a Supabase service-role key in browser code or any `NEXT_PUBLIC_*` variable.

## Quality checks

Run:

- `npm run lint`
- `npm run typecheck`
- `npm run build`

GitHub Actions runs these checks on pushes to `main`, rebuild branches, and pull requests. These checks validate code quality and compilation; they do not replace browser-level authentication, role, storage, and recovery tests.

## Implemented application areas

- Responsive application shell and role-aware navigation
- Supabase SSR session handling and auth callback flow
- Login, signup, password reset, and protected profile
- Server-protected admin dashboard and counts
- Database-managed public/private pages, sanitized HTML, page editor, and recycle bin
- Role-protected user management and Super Admin safeguards
- Public album/gallery routes and media relationships
- Admin-managed widgets for Bangladesh date/time and map configuration
- Media Library with title, visibility, file validation, duplicate detection, and storage paths
- Security headers, privacy page, and health endpoint

Implementation presence does not mean every flow has passed a live end-to-end test.

## Authorization model

- **Guest:** unauthenticated visitor; public content only.
- **Member:** authenticated account assigned the member role by database logic.
- **Admin:** trusted account with server-verified app metadata and database RBAC assignment.

Never grant administrator access based on user-editable profile metadata. RLS and server-side checks must remain authoritative.

## Database and migrations

Migrations are tracked in `supabase/migrations`. The existing Supabase database has a longer legacy migration history than the rebuilt application history. Therefore, the repository is **not yet a verified clean-room bootstrap** for creating a new production database. Do not apply its migrations to a fresh production project until the full schema, RLS policies, functions, storage configuration, and required seed data have been exported and verified.

## Remaining production-readiness checks

- Complete automated integration and browser tests for guest/member/admin authorization.
- Verify Auth security settings, including leaked-password protection, in Supabase Auth configuration.
- Test public/private storage access and upload/delete behavior using real test accounts.
- Verify recycle-bin restore and 30-day cleanup end to end.
- Establish and test a database backup/export and recovery procedure.
- Confirm production runtime routes and error logs through the hosting provider.

## Free-tier and privacy constraints

Supabase Free has quotas and may pause idle projects or change its terms. The application uses a provider subdomain to avoid the need for a paid custom domain. Hosting and database providers necessarily process technical data. The application does not intentionally add advertising or analytics.
