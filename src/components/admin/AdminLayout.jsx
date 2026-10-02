import { useEffect, useState } from 'react'
import { hasPermission } from '../../services/permissionService'
import { appPath } from '../../lib/routes'
import { Button } from '../ui'
import { Layout } from '../layout'

const adminNavItems = [
  { label: 'ড্যাশবোর্ড', path: '/dashboard', permission: 'dashboard_view' },
  { label: 'হোমপেজ ম্যানেজমেন্ট', path: '/manage/homepage', permission: 'homepage_manage' },
  { label: 'সাইডবার ম্যানেজমেন্ট', path: '/manage/sidebar', permission: 'sidebar_manage' },
  { label: 'ওয়েবসাইট তথ্য', path: '/manage/website-information', permission: 'settings_manage' },
  { label: 'Key Label Rename', path: '/manage/key-labels', permission: 'settings_manage' },
  { label: 'Icon Management', path: '/manage/icons', permission: 'settings_manage' },
  { label: 'পেজসমূহ', path: '/manage/pages', permission: 'content_manage' },
  { label: 'পোস্ট', path: '/manage/posts', permission: 'content_manage' },
  { label: 'অ্যালবাম', path: '/manage/albums', permission: 'media_manage' },
  { label: 'মিডিয়া', path: '/manage/media', permission: 'media_manage' },
  { label: 'ডাটাবেজ ও স্টোরেজ', path: '/manage/database-storage', permission: 'settings_manage' },
  { label: 'ইউজার', path: '/manage/users', permission: 'user_manage' },
  { label: 'অ্যাক্সেস', path: '/manage/access', permission: 'user_manage' },
  { label: 'অডিট', path: '/manage/audit', permission: 'audit_view' },
  { label: 'পরিসংখ্যান', path: '/manage/analytics', permission: 'audit_view' },
]
function navigate(path) { const target=appPath(path); if(window.location.pathname===target)return; window.history.pushState({},'',target); window.dispatchEvent(new Event('app:navigate')) }
export default function AdminLayout({ user, title, children }) {
 const [visibleNav,setVisibleNav]=useState([])
 useEffect(()=>{let active=true;Promise.all(adminNavItems.map(async item=>({...item,allowed:await hasPermission(item.permission)}))).then(results=>{if(active)setVisibleNav(results.filter(item=>item.allowed))}).catch(()=>{if(active)setVisibleNav([])});return()=>{active=false}},[user?.id])
 return <Layout seoTitle={title}><section className="home-section admin-page-shell"><div className="site-container"><nav className="admin-inline-nav" aria-label="ম্যানেজমেন্ট মডিউল">{visibleNav.map(item=>{const currentPath=window.location.pathname.replace(/\/$/,'')||'/';const itemPath=appPath(item.path).replace(/\/$/,'')||'/';const isActive=currentPath===itemPath;return <Button key={item.path} type="button" variant={isActive?'primary':'secondary'} className="admin-module-button" aria-current={isActive?'page':undefined} onClick={()=>navigate(item.path)}>{item.label}</Button>})}</nav><div className="admin-main-content">{children}</div></div></section></Layout>
}
