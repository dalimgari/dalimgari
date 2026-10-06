# Dalimgai - ডালিমগাড়ী

**Dalimgai - ডালিমগাড়ী** is a digital community platform for our village, designed to provide a shared web experience with an Android application target.

## Overview

Dalimgai brings community-oriented services, user access, content, and administration together in one platform.

The project is built as a web application with an Android target powered by Capacitor, while Supabase provides the backend services.

## Project

- **App name:** Dalimgai - ডালিমগাড়ী
- **Website name:** Dalimgai - ডালিমগাড়ী
- **Android application ID:** `com.dalimgari.app`
- **Repository:** `dalimgari/dalimgari`
- **Default branch:** `main`

## Technology

- HTML, CSS and JavaScript
- Supabase
- Capacitor
- Android
- GitHub Actions
- GitHub Pages

## Architecture

The project is organized around shared application logic with platform-specific adapters.

- `core/` — shared application components, definitions, controllers and contexts
- `style/` — global UI and component styles
- `platform/web/` — web platform configuration and Supabase adapter
- `android/` — Android/Capacitor project
- `scripts/` — build and Android configuration scripts
- `supabase/` — database migrations and backend configuration
- `tests/` — automated controller tests
- `.github/workflows/` — CI/CD workflows

## Web

The web application is deployed through GitHub Pages.

The production web build is generated into the `dist/` directory.

## Android

The Android application uses Capacitor to package the shared web application as a native Android application.

The project includes Android deep-link configuration for password-reset flows.

## Backend

Supabase is used for backend functionality, including authentication and database access.

Database security is enforced with Row Level Security (RLS), with migrations maintained under:

```
supabase/migrations/
```

## Development

Install dependencies:

```bash
npm install
```

Run tests:

```bash
npm test
```

Build the web application:

```bash
npm run build:web
```

For Android development, use the Capacitor/Android project included in the repository.

## Deployment

### Web

The repository includes a GitHub Actions workflow for GitHub Pages deployment:

```
.github/workflows/pages.yml
```

### Android

The repository includes a GitHub Actions workflow for Android builds:

```
.github/workflows/android.yml
```

## Security

- Supabase Row Level Security policies are maintained through migrations.
- Database indexes and RLS policies are hardened through version-controlled migrations.
- Do not commit private API keys, service-role keys, passwords, or other secrets to the repository.

## Status

Dalimgai is under active development as a community platform and Android application.

## License

No project license has been specified yet.
