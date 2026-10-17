# Dalimgari Full-Stack Requirements

## Non-negotiable goals

- Free-tier-first operation with no required paid API, paid plugin, or mandatory subscription.
- Full-stack dynamic application using Next.js, TypeScript, and Supabase.
- Three access classes: Guest (not signed in), Member (signed in), Admin (explicitly granted privileges).
- Privacy-first data collection and no advertising/analytics tracking by default.
- Responsive, accessible, clean UI with performance budgets.
- RLS on exposed database tables, server-side session verification, least privilege, safe uploads, and validated input.
- Automated lint, typecheck, build, integration and role-based access tests.
- Backups and a documented restore/recovery path before production use.
- No manual coding by the user; implementation is performed through ChatGPT-connected repository and database tools where supported.

## Constraints that cannot be promised

- Free providers impose quotas, may pause idle services, and can change terms.
- A custom domain may cost money; a provider subdomain is the zero-cost option.
- No application can guarantee perfect uptime, zero defects, absolute security, or secrecy from the infrastructure providers that host/process its data.
- Production authentication and email flows require the administrator to configure provider settings and secret environment variables. ChatGPT must not ask the user to paste secrets into chat.

## Current development policy

Work on `rebuild/nextjs-foundation`. Do not erase or migrate the live database until schema, role policies, storage rules, and a rollback plan have been reviewed. Do not deploy until automated checks and role-based tests pass.
