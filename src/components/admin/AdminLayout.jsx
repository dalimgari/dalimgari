import { useEffect, useState } from 'react'
import { hasPermission } from '../../services/permissionService'
import { ROUTES, PERMISSIONS, appPath } from '../../lib/routes'
import { Button } from '../ui'
import { Layout } from '../layout'
import { useGlobalLabels } from '../../context'

const adminNavItems = [
  { key: 'dashboard', path: ROUTES.dashboard, permission: PERMISSIONS.dashboardView },
  { key: 'homepage_management', path: ROUTES.manage.homepage, permission: PERMISSIONS.homepageManage },
  { key: 'sidebar_management', path: ROUTES.manage.sidebar, permission: PERMISSIONS.sidebarManage },
  { key: 'website_information', path: ROUTES.manage.websiteInformation, permission: PERMISSIONS.settingsManage },
  { key: 'key_label_rename', path: ROUTES.manage.keyLabels, permission: PERMISSIONS.settingsManage },
  { key: 'translation_overrides', path: ROUTES.manage.translationOverrides, permission: PERMISSIONS.settingsManage },
  { key: 'icon_management', path: ROUTES.manage.icons, permission: PERMISSIONS.settingsManage },
  { key: 'pages', path: ROUTES.manage.pages, permission: PERMISSIONS.contentManage },
  { key: 'posts', path: ROUTES.manage.posts, permission: PERMISSIONS.contentManage },
  { key: 'albums', path: ROUTES.manage.albums, permission: PERMISSIONS.mediaManage },
  { key: 'media', path: ROUTES.manage.media, permission: PERMISSIONS.mediaManage },
  { key: 'database_storage', path: ROUTES.manage.databaseStorage, permission: PERMISSIONS.settingsManage },
  { key: 'users', path: ROUTES.manage.users, permission: PERMISSIONS.userManage },
  { key: 'access', path: ROUTES.manage.access, permission: PERMISSIONS.userManage },
  { key: 'audit', path: ROUTES.manage.audit, permission: PERMISSIONS.auditView },
  { key: 'analytics', path: ROUTES.manage.analytics, permission: PERMISSIONS.auditView },
]

const ADMIN_LABELS = {
  dashboard: ['ড্যাশবোর্ড', 'Dashboard'], homepage_management: ['হোমপেজ ম্যানেজমেন্ট', 'Homepage Management'], sidebar_management: ['সাইডবার ম্যানেজমেন্ট', 'Sidebar Management'], website_information: ['ওয়েবসাইট তথ্য', 'Website Information'], key_label_rename: ['কী লেবেল', 'Key Labels'], translation_overrides: ['অনুবাদ ব্যবস্থাপনা', 'Translation Overrides'], icon_management: ['আইকন ব্যবস্থাপনা', 'Icon Management'], pages: ['পেজসমূহ', 'Pages'], posts: ['পোস্ট', 'Posts'], albums: ['অ্যালবাম', 'Albums'], media: ['মিডিয়া', 'Media'], database_storage: ['ডাটাবেজ ও স্টোরেজ', 'Database & Storage'], users: ['ইউজার', 'Users'], access: ['অ্যাক্সেস', 'Access'], audit: ['অডিট', 'Audit Logs'], analytics: ['পরিসংখ্যান', 'Analytics'],
}
function navigate(path) { const target=appPath(path); if(window.location.pathname===target)return; window.history.pushState({},'',target); window.dispatchEvent(new Event('app:navigate')) }
export default function AdminLayout({ user, title, children }) {
 const [visibleNav,setVisibleNav]=useState([])
 const { t } = useGlobalLabels()
 useEffect(()=>{let active=true;Promise.all(adminNavItems.map(async item=>({...item, label: t(item.key, ADMIN_LABELS[item.key]?.[0], ADMIN_LABELS[item.key]?.[1]), allowed:await hasPermission(item.permission)}))).then(results=>{if(active)setVisibleNav(results.filter(item=>item.allowed))}).catch(()=>{if(active)setVisibleNav([])});return()=>{active=false}},[user?.id,t])
 return <Layout seoTitle={title}><section className="home-section admin-page-shell"><div className="site-container"><nav className="admin-inline-nav" aria-label={t("management_modules", "ম্যানেজমেন্ট মডিউল", "Management modules")}>{visibleNav.map(item=>{const currentPath=window.location.pathname.replace(/\/$/,'')||'/';const itemPath=appPath(item.path).replace(/\/$/,'')||'/';const isActive=currentPath===itemPath;return <Button key={item.path} type="button" variant={isActive?'primary':'secondary'} className="admin-module-button" aria-current={isActive?'page':undefined} onClick={()=>navigate(item.path)}>{item.label}</Button>})}</nav><div className="admin-main-content">{children}</div></div></section></Layout>
}
