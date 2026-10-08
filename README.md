# Dalimgari Community Hub

Dalimgari Community Hub is a community-focused web platform for connecting members, sharing community updates, coordinating events, and managing community information.

## Overview

The project is a lightweight web application built around reusable HTML/CSS/JavaScript components with Supabase providing backend services.

### Main areas

- Home dashboard
- Community feed
- Member directory
- Events and RSVP
- Media gallery and albums
- User profile
- Stories
- Groups and group membership
- Pages and page followers
- Saved posts and collections
- Authentication
- Member and admin access control
- Community settings
- Language switching
- Theme preferences
- Date/time and location widgets

## Access model

The application distinguishes access by **role**:

- **Member** — standard authenticated community user
- **Admin** — community administrator with access to administrative functions

UI elements, routes, menus, and actions are intended to follow the user's authentication state and role.

## Project structure

    .
    ├── index.html
    ├── loader.js
    ├── context/
    │   ├── header.html
    │   ├── sidebar.html
    │   ├── content.html
    │   └── platform.js
    ├── component/
    │   ├── avatar/
    │   ├── date-time/
    │   ├── language/
    │   ├── location/
    │   ├── menu/
    │   └── search/
    ├── content/
    │   ├── home.html
    │   ├── login.html
    │   ├── create-account.html
    │   ├── forgot-password.html
    │   ├── profile.html
    │   ├── community.html
    │   └── admin.html
    ├── style/
    ├── supabase/
    ├── tests/
    └── .github/workflows/deploy.yml

## Architecture

The application uses a modular architecture:

1. **Loader** — initializes the application, shared context, routes, pages, and components.
2. **Context** — provides shared site areas such as header, sidebar, and content.
3. **Components** — reusable UI functionality such as avatar, menu, search, language, date/time, and location.
4. **Content pages** — individual application screens loaded through the central router.
5. **Design system** — shared visual tokens and component styling.
6. **Supabase** — authentication, database, storage, profiles, community data, and application settings.

## Supabase integration

Supabase is used for:

- Authentication and sessions
- Role-aware access control
- Community profiles
- Posts and comments
- Reactions
- Events and RSVPs
- Media and albums
- Community settings
- User preferences
- Social platform features (Stories, Groups, Pages, Saved Posts)
- Platform options
- Community media storage

Database access is performed through the Supabase client and is expected to be protected by appropriate Row Level Security (RLS) policies.

## Community functionality

The community area currently supports:

- Creating and viewing posts
- Post media
- Comments
- Likes/reactions
- Post editing and deletion by the author
- Post reporting
- Member listing
- Events and RSVP status
- Media gallery
- Public albums
- Community settings for administrators
- User language and theme preferences

## Internationalization

The interface supports English and Bengali content where translations are available.

## Themes and visual system

The project uses shared stylesheets and a UI design system to keep spacing, typography, controls, cards, and other visual elements consistent across the application.

Theme preferences can include:

- System mode
- Light mode
- Dark mode
- Configurable theme presets

## Authentication and permissions

Authentication state is used to determine what the user can access.

Typical conditions include:
- Guest users can access public areas.
- Authenticated members can use member functionality.
- Admin-only routes and controls require the **admin** role.
- Login-dependent actions redirect unauthenticated users to login.
- UI access should remain consistent with route-level access checks.

## Development

This project is intentionally lightweight and does not require a large frontend framework.

The main application is loaded from `index.html` and `loader.js`.

Before deployment, GitHub Actions validates JavaScript syntax and runs the project's smoke tests.

## Deployment

Deployment is automated through GitHub Actions and GitHub Pages.

The deployment workflow:
1. Checks out the repository.
2. Sets up Node.js.
3. Validates JavaScript syntax.
4. Runs smoke tests.
5. Verifies required application files.
6. Builds the GitHub Pages artifact.
7. Deploys the site.

## Project status

The repository is at a consolidated social-platform checkpoint with core social, Messenger, Stories, Groups, Pages, Saved Posts, event RSVP, moderation reporting, preferences, and access-control foundations integrated. Architecture, UI consistency, access permissions, authentication behavior, community features, and administrative controls are being continuously unified and refined.

## Maintenance principles

When extending the project:

- Prefer existing components over duplicating UI.
- Use the shared design system for visual changes.
- Keep route and element permissions centralized.
- Keep authentication state and role checks consistent.
- Prefer reusable data/configuration patterns over hard-coded community settings.
- Preserve responsive behavior and accessibility.
- Validate JavaScript and run smoke tests before deployment.
- Apply database-side authorization with RLS rather than relying only on client-side UI restrictions.

## Repository

**Repository:** `dalimgari/dalimgari`

The project is maintained as the source of truth for the Dalimgari Community Hub website.