# Security Policy

## Supported deployment

Only deploy a reviewed, patched release. Keep Next.js, React, Supabase SDKs, and transitive dependencies updated and pinned with a committed lockfile.

## Secrets

- Store production credentials only in the hosting provider's encrypted environment settings.
- Never commit `.env.local`, database passwords, service-role keys, secret API keys, access tokens, or personal data.
- Only publish Supabase URL and publishable key to the browser; database Row Level Security must enforce access.
- Rotate a credential immediately if it may have been exposed.

## Authorization

- Treat browser input and user-editable metadata as untrusted.
- Verify sessions server-side for protected routes.
- Enforce Admin/Member permissions in trusted server logic and PostgreSQL RLS policies.
- Never allow a public signup request to grant itself an administrative role.
- Test private/only-me content as Guest, Member, and Admin.

## Reporting

Do not publish secrets or exploit details in public issues. Report suspected security issues privately to the repository owner.
