import { useEffect, useState } from 'react'
import { hasPermission } from '../../services/permissionService'
import { ROUTES, PERMISSIONS, appPath } from '../../lib/routes'
import { MANAGEMENT_ROUTE_DEFINITIONS } from '../../config/routeDefinitions'
import { UI_SSOT } from '../../config/uiSSOT'
import { Button } from '../ui'
import { Layout } from '../layout'
import { useGlobalLabels } from '../../context'

const adminNavItems = [
  { key: 'dashboard', path: ROUTES.dashboard, permission: PERMISSIONS.dashboardView, labelKey: 'dashboard' },
  ...MANAGEMENT_ROUTE_DEFINITIONS,
]

function navigate(path) { const target=appPath(path); if(window.location.pathname===target)return; window.history.pushState({},'',target); window.dispatchEvent(new Event('app:navigate')) }

export default function AdminLayout({ user, title, children }) {
 const [visibleNav,setVisibleNav]=useState([])
 const { t } = useGlobalLabels()
 useEffect(()=>{let active=true;Promise.all(adminNavItems.map(async item=>({...item, label: t(item.labelKey, UI_SSOT.adminLabels?.[item.labelKey]?.bng || item.labelKey), allowed:await hasPermission(item.permission)}))).then(results=>{if(active)setVisibleNav(results.filter(item=>item.allowed))}).catch(()=>{if(active)setVisibleNav([])});return()=>{active=false}},[user?.id,t])
 return <Layout seoTitle={title}><section className="home-section admin-page-shell"><div className="site-container"><nav className="admin-inline-nav" aria-label={t('management_modules', UI_SSOT.adminLabels.management_modules.bng)}>{visibleNav.map(item=>{const currentPath=window.location.pathname.replace(/\/$/,'')||'/';const itemPath=appPath(item.path).replace(/\/$/,'')||'/';const isActive=currentPath===itemPath;return <Button key={item.path} type="button" variant={isActive?'primary':'secondary'} className="admin-module-button" aria-current={isActive?'page':undefined} onClick={()=>navigate(item.path)}>{item.label}</Button>})}</nav><div className="admin-main-content">{children}</div></div></section></Layout>
}
