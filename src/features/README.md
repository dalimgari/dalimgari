# feature-based architecture

`src/features` is the canonical home for domain-specific application code. The migration is incremental so working routes and database flows are not broken by a large rewrite.

## target structure

```text
src/
├── app/                 # bootstrap, providers, router, app configuration
├── features/            # domain features; primary place for feature code
│   ├── auth/
│   ├── website/
│   ├── pages/
│   ├── posts/
│   ├── albums/
│   ├── media/
│   ├── users/
│   ├── seo/
│   ├── customization/
│   ├── translation/
│   ├── analytics/
│   ├── audit/
│   └── backup/
├── components/
│   ├── ui/              # reusable visual primitives
│   ├── layout/          # reusable page/layout primitives
│   └── common/          # shared cross-feature components
├── services/            # external/data integrations
│   ├── supabase/
│   └── storage/
├── hooks/               # cross-feature React hooks
├── utils/               # small pure utilities
├── styles/              # global design system and theme
└── main.jsx
```

## dependency direction

`pages/features -> shared components/hooks -> services -> external systems`

Domain features must not reach into another feature's private implementation. Shared UI must remain domain-agnostic. Supabase/storage access should be centralized behind services rather than scattered across presentation components.

## migration policy

1. New domain-specific code goes under the relevant `src/features/<domain>/` directory.
2. Shared visual primitives go under `src/components/ui/`.
3. Shared layouts go under `src/components/layout/`.
4. Cross-feature integrations go under `src/services/`.
5. Existing stable code is migrated only after its imports and runtime dependencies are verified.
6. A migrated feature must pass production build before its old location is removed.
7. Empty scaffold directories and duplicate architectural layers should not be recreated.
8. All new code and filenames use lowercase naming.

The current repository contains legacy responsibility-based folders from earlier iterations. They remain temporarily only where active imports still depend on them; they are not the target architecture.