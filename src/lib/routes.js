export const ROUTES = Object.freeze({
  home: '/',
  posts: '/posts',
  albums: '/albums',
  information: '/information',
  search: '/search',
  login: '/login',
  signup: '/signup',
  dashboard: '/dashboard',
  profile: '/profile',
  accessDenied: '/access-denied',
  pageDetailPrefix: '/pages',
  albumDetailPrefix: '/albums',
  postDetailPrefix: '/posts',
  manage: Object.freeze({
    homepage: '/manage/homepage',
    sidebar: '/manage/sidebar',
    pages: '/manage/pages',
    posts: '/manage/posts',
    albums: '/manage/albums',
    media: '/manage/media',
    users: '/manage/users',
    access: '/manage/access',
    audit: '/manage/audit',
    analytics: '/manage/analytics',
    websiteInformation: '/manage/website-information',
    adminInformation: '/manage/admin-information',
    databaseStorage: '/manage/database-storage',
    ruralVisual: '/manage/rural-visual',
    keyLabels: '/manage/key-labels',
    translationOverrides: '/manage/translation-overrides',
    icons: '/manage/icons',
  }),
  legacy: Object.freeze({
    '/admin': '/dashboard',
    '/admin/homepage': '/manage/homepage',
    '/admin/sidebar': '/manage/sidebar',
    '/admin/pages': '/manage/pages',
    '/admin/posts': '/manage/posts',
    '/admin/albums': '/manage/albums',
    '/admin/media': '/manage/media',
    '/admin/users': '/manage/users',
    '/admin/access': '/manage/access',
    '/admin/audit': '/manage/audit',
    '/admin/analytics': '/manage/analytics',
    '/admin/website-information': '/manage/website-information',
    '/admin/admin-information': '/manage/admin-information',
    '/admin/database-storage': '/manage/database-storage',
    '/admin/rural-visual': '/manage/rural-visual',
    '/admin/key-labels': '/manage/key-labels',
    '/admin/translation-overrides': '/manage/translation-overrides',
    '/admin/icons': '/manage/icons',
  }),
})

export const PERMISSIONS = Object.freeze({
  dashboardView: 'dashboard_view',
  homepageManage: 'homepage_manage',
  sidebarManage: 'sidebar_manage',
  contentManage: 'content_manage',
  mediaManage: 'media_manage',
  userManage: 'user_manage',
  auditView: 'audit_view',
  settingsManage: 'settings_manage',
})

export function appPath(path = ROUTES.home) {
  const base = import.meta.env.BASE_URL || '/'
  const normalizedBase = base.endsWith('/') ? base.slice(0, -1) : base
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${normalizedBase}${normalizedPath}` || ROUTES.home
}
