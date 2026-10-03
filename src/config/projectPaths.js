/**
 * Canonical project-internal paths.
 *
 * Feature: Project Path Registry
 * Purpose: keep tests/tooling and other cross-cutting code aligned with the
 * actual project structure without scattering repository-relative path strings.
 *
 * When a project file is intentionally moved, update the canonical entry here
 * rather than changing every consumer independently.
 */
export const PROJECT_PATHS = Object.freeze({
  root: '.',

  package: 'package.json',
  viteConfig: 'vite.config.js',

  app: {
    entry: 'src/App.jsx',
    routes: 'src/lib/routes.js',
    routeDefinitions: 'src/config/routeDefinitions.js',
  },

  config: {
    uiSSOT: 'src/config/uiSSOT.js',
    mediaPolicy: 'src/config/mediaPolicy.js',
    preferences: 'src/config/preferences.js',
  },

  header: {
    component: 'src/header/Header.jsx',
  },

  sidebar: {
    component: 'src/sidebar/Sidebar.jsx',
  },

  context: {
    preferences: 'src/context/PreferencesContext.jsx',
  },

  components: {
    ui: {
      profileAvatar: 'src/components/ui/ProfileAvatar.jsx',
      mediaContent: 'src/components/ui/MediaContent.jsx',
    },
    auth: {
      adminRoute: 'src/components/auth/AdminRoute.jsx',
    },
    admin: {
      adminLayout: 'src/components/admin/AdminLayout.jsx',
      securityStatusCard: 'src/components/admin/SecurityStatusCard.jsx',
    },
    website: {
      banner: 'src/components/website/Banner.jsx',
    },
  },

  pages: {
    information: 'src/pages/Information.jsx',
    albums: 'src/pages/Albums.jsx',
    postDetail: 'src/pages/PostDetail.jsx',
    dashboard: 'src/pages/admin/Dashboard.jsx',
    mediaManagement: 'src/pages/admin/MediaManagement.jsx',
    keyLabelManagement: 'src/pages/admin/KeyLabelManagement.jsx',
    translationOverrideManagement: 'src/pages/admin/TranslationOverrideManagement.jsx',
  },

  services: {
    profileAvatar: 'src/services/profileAvatarService.js',
    permission: 'src/services/permissionService.js',
    securityTest: 'src/services/securityTestService.js',
    websiteScan: 'src/services/websiteScanService.js',
    globalLabel: 'src/services/globalLabelService.js',
    languageRuntime: 'src/services/languageRuntime.js',
    devicePreference: 'src/services/devicePreferenceService.js',
    translationOverride: 'src/services/translationOverrideService.js',
    media: 'src/services/mediaService.js',
  },

  functions: {
    adminSecurityTest: 'supabase/functions/admin-security-test/index.ts',
  },

  workflows: {
    deploy: '.github/workflows/deploy.yml',
    tests: '.github/workflows/tests.yml',
  },

  directories: {
    migrations: 'supabase/migrations',
  },

  migrations: {
    mediaHardening: 'supabase/migrations/20261001201247_harden_media_storage_and_rbac_policies.sql',
    adminAccessGuard: 'supabase/migrations/20261001201305_add_admin_access_guard_rpc.sql',
    profileAvatarFallback: 'supabase/migrations/20261002155207_profile_avatar_fallback.sql',
    adminSecurityTestStatus: 'supabase/migrations/20261002130844_admin_security_test_status.sql',
    globalUiLabels: 'supabase/migrations/20261001220445_create_global_ui_labels.sql',
    singleLanguageGlobalUiLabels: 'supabase/migrations/20261003110000_single_language_global_ui_labels.sql',
    translationOverrides: 'supabase/migrations/20261003123000_create_translation_overrides.sql',
    publicTranslationOverrides: 'supabase/migrations/20261003140000_make_translation_overrides_public_equal.sql',
    managementRouteRegistry: 'supabase/migrations/20261003150000_align_management_route_registry.sql',
  },
})

export const projectPathBasename = (projectPath) => projectPath.split('/').pop()

export default PROJECT_PATHS
