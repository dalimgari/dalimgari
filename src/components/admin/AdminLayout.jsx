import { useEffect, useState } from 'react'
import { hasPermission } from '../../services/permissionService'
import { appPath } from '../../lib/routes'
import { Button } from '../ui'
import { Layout } from '../layout'
import { useGlobalLabels } from '../../context'

const adminNavItems = [
  { key: 'dashboard', path: '/dashboard', permission: 'dashboard_view' },
  { key: 'homepage_management', path: '/manage/homepage', permission: 'homepage_manage' },
  { key: 'sidebar_management', path: '/manage/sidebar', permission: 'sidebar_manage' },
  { key: 'website_information', path: '/manage/website-information', permission: 'settings_manage' },
  { key: 'key_label_rename', path: '/manage/key-labels', permission: 'settings_manage' },
  { key: 'icon_management', path: '/manage/icons', permission: 'settings_manage' },
  { key: 'pages', path: '/manage/pages', permission: 'content_manage' },
  { key: 'posts', path: '/manage/posts', permission: 'content_manage' },
  { key: 'albums', path: '/manage/albums', permission: 'media_manage' },
  { key: 'media', path: '/manage/media', permission: 'media_manage' },
  { key: 'database_storage', path: '/manage/database-storage', permission: 'settings_manage' },
  { key: 'users', path: '/manage/users', permission: 'user_manage' },
  { key: 'access', path: '/manage/access', permission: 'user_manage' },
  { key: 'audit', path: '/manage/audit', permission: 'audit_view' },
  { key: 'analytics', path: '/manage/analytics', permission: 'audit_view' },
]

const ADMIN_LABELS = {
  dashboard: ['ড্যাশবোর্ড', 'Dashboard'], homepage_management: ['হোমপেজ ম্যানেজমেন্ট', 'Homepage Management'], sidebar_management: ['সাইডবার ম্যানেজমেন্ট', 'Sidebar Management'], website_information: ['ওয়েবসাইট তথ্য', 'Website Information'], key_label_rename: ['Key Label Rename', 'Key Label Rename'], icon_management: ['আইকন ব্যবস্থাপনা', 'Icon Management'], pages: ['পেজসমূহ', 'Pages'], posts: ['পোস্ট', 'Posts'], albums: ['অ্যালবাম', 'Albums'], media: ['মিডিয়া', 'Media'], database_storage: ['ডাটাবেজ ও স্টোরেজ', 'Database & Storage'], users: ['ইউজার', 'Users'], access: ['অ্যাক্সেস', 'Access'], audit: ['অডিট', 'Audit Logs'], analytics: ['পরিসংখ্যান', 'Analytics'],
}
function navigate(path) { const target=appPath(path); if(window.location.pathname===target)return; window.history.pushState({},'',target); window.dispatchEvent(new Event('app:navigate')) }
export default function AdminLayout({ user, title, children }) {
 const [visibleNav,setVisibleNav]=useState([])
 const { t } = useGlobalLabels()
 useEffect(()=>{let active=true;Promise.all(adminNavItems.map(async item=>({...item, label: t(item.key, ADMIN_LABELS[item.key]?.[0], ADMIN_LABELS[item.key]?.[1]), allowed:await hasPermission(item.permission)}))).then(results=>{if(active)setVisibleNav(results.filter(item=>item.allowed))}).catch(()=>{if(active)setVisibleNav([])});return()=>{active=false}},[user?.id,t])
 return <Layout seoTitle={title}><section className="home-section admin-page-shell"><div className="site-container"><nav className="admin-inline-nav" aria-label={t("management_modules", "ম্যানেজমেন্ট মডিউল", "Management modules")}>{visibleNav.map(item=>{const currentPath=window.location.pathname.replace(/\/$/,'')||'/';const itemPath=appPath(item.path).replace(/\/$/,'')||'/';const isActive=currentPath===itemPath;return <Button key={item.path} type="button" variant={isActive?'primary':'secondary'} className="admin-module-button" aria-current={isActive?'page':undefined} onClick={()=>navigate(item.path)}>{item.label}</Button>})}</nav><div className="admin-main-content">{children}</div></div></section></Layout>
}
