import Home from './pages/Home'
import Posts from './pages/Posts'
import Albums from './pages/Albums'
import AlbumDetail from './pages/AlbumDetail'
import Search from './pages/Search'
import Login from './pages/Login'
import Profile from './pages/Profile'
import ControlPanel from './pages/ControlPanel'
import Dashboard from './pages/admin/Dashboard'
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
import PageDetail from './pages/PageDetail'
import PostDetail from './pages/PostDetail'
import Information from './pages/Information'
import NotFound from './pages/NotFound'
import { useEffect, useState } from 'react'
import AdminRoute from './components/auth/AdminRoute'
import UserRoute from './components/auth/UserRoute'

function getPath() {
  const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '')
  const escapedBase = base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return window.location.pathname.replace(new RegExp(`^${escapedBase}`), '').replace(/\/$/, '') || '/'
}
function RouteView({ children }) { return children }
function adminPage(path) {
  if (path === '/admin') return <AdminRoute><Dashboard /></AdminRoute>
  if (path === '/admin/homepage') return <AdminRoute permission="homepage_manage"><HomepageManagement /></AdminRoute>
  if (path === '/admin/sidebar') return <AdminRoute permission="sidebar_manage"><SidebarManagement /></AdminRoute>
  if (path === '/admin/pages') return <AdminRoute permission="content_manage"><PagesManagement /></AdminRoute>
  if (path === '/admin/posts') return <AdminRoute permission="content_manage"><PostsManagement /></AdminRoute>
  if (path === '/admin/albums') return <AdminRoute permission="media_manage"><AlbumsManagement /></AdminRoute>
  if (path === '/admin/media') return <AdminRoute permission="media_manage"><MediaManagement /></AdminRoute>
  if (path === '/admin/users') return <AdminRoute permission="user_manage"><UsersManagement /></AdminRoute>
  if (path === '/admin/access') return <AdminRoute permission="user_manage"><AccessManagement /></AdminRoute>
  if (path === '/admin/audit') return <AdminRoute permission="audit_view"><AuditLogs /></AdminRoute>
  if (path === '/admin/analytics') return <AdminRoute permission="audit_view"><Analytics /></AdminRoute>
  if (path === '/admin/website-information') return <AdminRoute permission="settings_manage"><ControlPanel /></AdminRoute>
  if (path === '/admin/admin-information') return <AdminRoute permission="settings_manage"><AdminInformationManagement /></AdminRoute>
  if (path === '/admin/database-storage') return <AdminRoute permission="settings_manage"><DatabaseStorageInformation /></AdminRoute>
  if (path === '/admin/rural-visual') return <AdminRoute permission="settings_manage"><RuralVisualManagement /></AdminRoute>
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
  let page = <NotFound />
  const pageMatch = path.match(/^\/pages\/([^/]+)$/); const albumMatch = path.match(/^\/albums\/([^/]+)$/); const postMatch = path.match(/^\/posts\/([^/]+)$/); const admin = path.startsWith('/admin') ? adminPage(path) : null
  if (admin) page = admin
  else if (pageMatch) page = <PageDetail slug={decodeURIComponent(pageMatch[1])} />
  else if (albumMatch) page = <AlbumDetail albumKey={decodeURIComponent(albumMatch[1])} />
  else if (postMatch) page = <PostDetail postId={decodeURIComponent(postMatch[1])} />
  else if (path === '/') page = <Home />
  else if (path === '/posts') page = <Posts />
  else if (path === '/albums') page = <Albums />
  else if (path === '/search') page = <Search />
  else if (path === '/information') page = <Information />
  else if (path === '/login') page = <Login />
  else if (path === '/profile') page = <UserRoute><Profile /></UserRoute>
  else if (/^\/[^/]+$/.test(path)) page = <PageDetail slug={decodeURIComponent(path.slice(1))} />
  return <RouteView>{page}</RouteView>
}
