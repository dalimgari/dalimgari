import Home from './pages/Home'
import Posts from './pages/Posts'
import Albums from './pages/Albums'
import AlbumDetail from './pages/AlbumDetail'
import Login from './pages/Login'
import Signup from './pages/Signup'
import ControlPanel from './pages/ControlPanel'
import PagesManagement from './pages/admin/PagesManagement'
import PostsManagement from './pages/admin/PostsManagement'
import AlbumsManagement from './pages/admin/AlbumsManagement'
import MediaManagement from './pages/admin/MediaManagement'
import UsersManagement from './pages/admin/UsersManagement'
import AccessManagement from './pages/admin/AccessManagement'
import AuditLogs from './pages/admin/AuditLogs'
import Analytics from './pages/admin/Analytics'
import HomepageManagement from './pages/admin/HomepageManagement'
import SidebarManagement from './pages/admin/SidebarManagement'
import RuralVisualManagement from './pages/admin/RuralVisualManagement'
import AdminInformationManagement from './pages/admin/AdminInformationManagement'
import DatabaseStorageInformation from './pages/admin/DatabaseStorageInformation'
import KeyLabelManagement from './pages/admin/KeyLabelManagement'
import TranslationOverrideManagement from './pages/admin/TranslationOverrideManagement'
import IconManagement from './pages/admin/IconManagement'
import PageDetail from './pages/PageDetail'
import PostDetail from './pages/PostDetail'
import Information from './pages/Information'
import SearchPage from './search/SearchPage'
import AccessDenied from './pages/AccessDenied'
import NotFound from './pages/NotFound'
import RoleRoute from './components/auth/RoleRoute'
import AdminRoute from './components/auth/AdminRoute'
import { useEffect, useState } from 'react'

function getPath() {
  const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '')
  let path = window.location.pathname
  if (base && path.startsWith(base)) path = path.slice(base.length)
  return path.replace(/\/$/, '') || '/'
}

function appPath(path = '/') {
  const base = import.meta.env.BASE_URL || '/'
  const b = base.endsWith('/') ? base.slice(0, -1) : base
  const p = path.startsWith('/') ? path : '/' + path
  return b + p || '/'
}

const managementPages = {
  '/manage/homepage': [HomepageManagement, 'homepage_manage'],
  '/manage/sidebar': [SidebarManagement, 'sidebar_manage'],
  '/manage/pages': [PagesManagement, 'content_manage'],
  '/manage/posts': [PostsManagement, 'content_manage'],
  '/manage/albums': [AlbumsManagement, 'media_manage'],
  '/manage/media': [MediaManagement, 'media_manage'],
  '/manage/users': [UsersManagement, 'user_manage'],
  '/manage/access': [AccessManagement, 'user_manage'],
  '/manage/audit': [AuditLogs, 'audit_view'],
  '/manage/analytics': [Analytics, 'audit_view'],
  '/manage/website-information': [ControlPanel, 'settings_manage'],
  '/manage/admin-information': [AdminInformationManagement, 'settings_manage'],
  '/manage/database-storage': [DatabaseStorageInformation, 'settings_manage'],
  '/manage/rural-visual': [RuralVisualManagement, 'settings_manage'],
  '/manage/key-labels': [KeyLabelManagement, 'settings_manage'],
  '/manage/translation-overrides': [TranslationOverrideManagement, 'settings_manage'],
  '/manage/icons': [IconManagement, 'settings_manage'],
}

const legacyPaths = {
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
}

function getRedirectTarget(path) {
  if (legacyPaths[path]) return legacyPaths[path]
  if (path === '/profile') return '/dashboard'
  if (/^\/(admin|manager|editor|moderator|user)\/profile$/.test(path)) return '/dashboard'
  if (/^\/dashboard\/(admin|manager|editor|moderator|user)$/.test(path)) return '/dashboard'
  return null
}

export default function App() {
  const [path, setPath] = useState(getPath)

  useEffect(() => {
    const sync = () => setPath(getPath())
    window.addEventListener('popstate', sync)
    window.addEventListener('app:navigate', sync)
    return () => {
      window.removeEventListener('popstate', sync)
      window.removeEventListener('app:navigate', sync)
    }
  }, [])

  const redirectTarget = getRedirectTarget(path)

  useEffect(() => {
    if (!redirectTarget || redirectTarget === path) return
    const target = appPath(redirectTarget)
    if (window.location.pathname !== target) {
      window.history.replaceState({}, '', target)
      setPath(getPath())
    }
  }, [path, redirectTarget])

  if (redirectTarget && redirectTarget !== path) return null

  let page = <NotFound />
  const pageMatch = path.match(/^\/pages\/([^/]+)$/)
  const albumMatch = path.match(/^\/albums\/([^/]+)$/)
  const postMatch = path.match(/^\/posts\/([^/]+)$/)
  const management = managementPages[path]

  if (path === '/dashboard') page = <RoleRoute />
  else if (management) {
    const Component = management[0]
    page = <AdminRoute permission={management[1]} routePath={path}><Component /></AdminRoute>
  } else if (path === '/access-denied') page = <AccessDenied />
  else if (pageMatch) page = <PageDetail slug={decodeURIComponent(pageMatch[1])} />
  else if (albumMatch) page = <AlbumDetail albumKey={decodeURIComponent(albumMatch[1])} />
  else if (postMatch) page = <PostDetail postId={decodeURIComponent(postMatch[1])} />
  else if (path === '/') page = <Home />
  else if (path === '/posts') page = <Posts />
  else if (path === '/albums') page = <Albums />
  else if (path === '/information') page = <Information />
  else if (path === '/search') page = <SearchPage />
  else if (path === '/login') page = <Login />
  else if (path === '/signup') page = <Signup />
  else if (/^\/[^/]+$/.test(path)) page = <PageDetail slug={decodeURIComponent(path.slice(1))} />

  return page
}
