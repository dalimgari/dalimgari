# Dalimgari — Full-Stack Dynamic Web Application

A Next.js App Router application using React, TypeScript, and Supabase.

## Requirements

- Node.js 22.12 or newer
- npm
- A Supabase project and its public project URL/publishable key

## Local development

1. Copy `.env.example` to `.env.local`.
2. Fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
3. Install dependencies with `npm install`.
4. Run `npm run dev`.

## Quality checks

- `npm run lint`
- `npm run typecheck`
- `npm run build`

## Security rules

- Never place Supabase service-role or secret keys in browser code or any `NEXT_PUBLIC_*` variable.
- Enforce authorization in server-side code and PostgreSQL Row Level Security policies.
- Treat client-provided metadata as untrusted; authorization must use trusted database state or server-verified claims.
- Do not deploy production features until database schema, RLS policies, and authentication flows are tested.

## Deployment

This project requires a host that supports the Next.js server runtime. GitHub Pages alone is not a suitable production host for server-rendered routes or server actions.

## Rebuild plan

The previous application snapshot is preserved in `backup/76-before-fullstack-rebuild-20261017`. The new application is being developed separately in `rebuild/nextjs-foundation` until checks pass and a reviewed deployment plan is approved.
