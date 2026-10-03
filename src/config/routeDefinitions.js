import { ROUTES, PERMISSIONS } from '../lib/routes'

export const MANAGEMENT_ROUTE_DEFINITIONS = Object.freeze([
  { key: 'homepage', path: ROUTES.manage.homepage, permission: PERMISSIONS.homepageManage, labelKey: 'homepage_management' },
  { key: 'sidebar', path: ROUTES.manage.sidebar, permission: PERMISSIONS.sidebarManage, labelKey: 'sidebar_management' },
  { key: 'ruralVisual', path: ROUTES.manage.ruralVisual, permission: PERMISSIONS.settingsManage, labelKey: 'rural_visual_management', navigation: false },
  { key: 'websiteInformation', path: ROUTES.manage.websiteInformation, permission: PERMISSIONS.settingsManage, labelKey: 'website_information' },
  { key: 'keyLabels', path: ROUTES.manage.keyLabels, permission: PERMISSIONS.settingsManage, labelKey: 'key_label_rename' },
  { key: 'translationOverrides', path: ROUTES.manage.translationOverrides, permission: PERMISSIONS.settingsManage, labelKey: 'translation_overrides' },
  { key: 'icons', path: ROUTES.manage.icons, permission: PERMISSIONS.settingsManage, labelKey: 'icon_management' },
  { key: 'pages', path: ROUTES.manage.pages, permission: PERMISSIONS.contentManage, labelKey: 'pages' },
  { key: 'posts', path: ROUTES.manage.posts, permission: PERMISSIONS.contentManage, labelKey: 'posts' },
  { key: 'albums', path: ROUTES.manage.albums, permission: PERMISSIONS.mediaManage, labelKey: 'albums' },
  { key: 'media', path: ROUTES.manage.media, permission: PERMISSIONS.mediaManage, labelKey: 'media' },
  { key: 'adminInformation', path: ROUTES.manage.adminInformation, permission: PERMISSIONS.settingsManage, labelKey: 'admin_information', navigation: false },
  { key: 'databaseStorage', path: ROUTES.manage.databaseStorage, permission: PERMISSIONS.settingsManage, labelKey: 'database_storage' },
  { key: 'users', path: ROUTES.manage.users, permission: PERMISSIONS.userManage, labelKey: 'users' },
  { key: 'access', path: ROUTES.manage.access, permission: PERMISSIONS.userManage, labelKey: 'access' },
  { key: 'audit', path: ROUTES.manage.audit, permission: PERMISSIONS.auditView, labelKey: 'audit' },
  { key: 'analytics', path: ROUTES.manage.analytics, permission: PERMISSIONS.auditView, labelKey: 'analytics' },
])

export const MANAGEMENT_ROUTE_BY_PATH = Object.freeze(
  Object.fromEntries(MANAGEMENT_ROUTE_DEFINITIONS.map((definition) => [definition.path, definition]))
)

export const MANAGEMENT_ROUTE_BY_KEY = Object.freeze(
  Object.fromEntries(MANAGEMENT_ROUTE_DEFINITIONS.map((definition) => [definition.key, definition]))
)

export const ROUTE_DEFINITIONS = Object.freeze({
  management: MANAGEMENT_ROUTE_DEFINITIONS,
})
