import Home from './pages/Home'
import Posts from './pages/Posts'
import Albums from './pages/Albums'
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
import AuditLogs from './pages/admin/AuditLogs'
import PageDetail from './pages/PageDetail'
import PostDetail from './pages/PostDetail'
import Information from './pages/Information'
import NotFound from './pages/NotFound'
import Skeleton from './components/ui/Skeleton'
import AdminRoute from './components/auth/AdminRoute'
import UserRoute from './components/auth/UserRoute'

function getPath() {
  const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '')
  const escapedBase = base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return window.location.pathname.replace(new RegExp(`^${escapedBase}`), '').replace(/\/$/, '') || '/'
}

function RouteView({ children }) {
  return children
}

function adminPage(path) {
  if (path === '/admin') return <AdminRoute><Dashboard /></AdminRoute>
  if (path === '/admin/pages') return <AdminRoute permission="content_manage"><PagesManagement /></AdminRoute>
  if (path === '/admin/posts') return <AdminRoute permission="content_manage"><PostsManagement /></AdminRoute>
  if (path === '/admin/albums') return <AdminRoute permission="media_manage"><AlbumsManagement /></AdminRoute>
  if (path === '/admin/media') return <AdminRoute permission="media_manage"><MediaManagement /></AdminRoute>
  if (path === '/admin/users') return <AdminRoute permission="user_manage"><UsersManagement /></AdminRoute>
  if (path === '/admin/audit') return <AdminRoute permission="audit_view"><AuditLogs /></AdminRoute>
  if (path === '/admin/website-information') return <AdminRoute permission="settings_manage"><ControlPanel /></AdminRoute>
  return null
}

export default function App() {
  const path = getPath()
  let page = <NotFound />
  const pageMatch = path.match(/^\/pages\/([^/]+)$/)
  const postMatch = path.match(/^\/posts\/([^/]+)$/)
  const admin = path.startsWith('/admin') ? adminPage(path) : null

  if (admin) page = admin
  else if (pageMatch) page = <PageDetail slug={decodeURIComponent(pageMatch[1])} />
  else if (postMatch) page = <PostDetail postId={decodeURIComponent(postMatch[1])} />
  else if (path === '/') page = <Home />
  else if (path === '/posts') page = <Posts />
  else if (path === '/albums') page = <Albums />
  else if (path === '/search') page = <Search />
  else if (path === '/information') page = <Information />
  else if (path === '/login') page = <Login />
  else if (path === '/profile') page = <UserRoute><Profile /></UserRoute>

  return <RouteView>{page}</RouteView>
}
