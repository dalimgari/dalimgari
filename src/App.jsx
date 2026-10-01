import { useEffect, useState } from 'react'\nimport Home from './pages/Home'
import Posts from './pages/Posts'
import Albums from './pages/Albums'
import Search from './pages/Search'
import Login from './pages/Login'
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
import Skeleton from './components/ui/Skeleton'

function getPath() {
  const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '')
  return window.location.pathname.replace(new RegExp(`^${base}`), '').replace(/\/$/, '') || '/'
}

function RouteView({ path, children }) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setReady(true)
  }, [path])

  if (!ready) {
    const variant = path === '/' ? 'home' : path.match(/^\/(pages|posts)\//) ? 'detail' : 'page'
    return <Skeleton variant={variant} />
  }

  return children
}

export default function App() {
  const path = getPath()
  let page = <Home />

  const pageMatch = path.match(/^\/pages\/([^/]+)$/)
  const postMatch = path.match(/^\/posts\/([^/]+)$/)

  if (pageMatch) page = <PageDetail slug={decodeURIComponent(pageMatch[1])} />
  else if (postMatch) page = <PostDetail postId={decodeURIComponent(postMatch[1])} />
  else if (path === '/posts') page = <Posts />
  else if (path === '/albums') page = <Albums />
  else if (path === '/search') page = <Search />
  else if (path === '/information') page = <Information />
  else if (path === '/login') page = <Login />
  else if (path === '/admin') page = <Dashboard />
  else if (path === '/admin/pages') page = <PagesManagement />
  else if (path === '/admin/posts') page = <PostsManagement />
  else if (path === '/admin/albums') page = <AlbumsManagement />
  else if (path === '/admin/media') page = <MediaManagement />
  else if (path === '/admin/users') page = <UsersManagement />
  else if (path === '/admin/audit') page = <AuditLogs />
  else if (path === '/admin/website-information') page = <ControlPanel />

  return <RouteView path={path}>{page}</RouteView>
}
