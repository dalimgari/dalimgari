import Home from './pages/Home'
import Posts from './pages/Posts'
import Albums from './pages/Albums'
import Search from './pages/Search'
import Login from './pages/Login'
import ControlPanel from './pages/ControlPanel'
import PagesManagement from './pages/admin/PagesManagement'
import PostsManagement from './pages/admin/PostsManagement'
import AlbumsManagement from './pages/admin/AlbumsManagement'
import MediaManagement from './pages/admin/MediaManagement'
import UsersManagement from './pages/admin/UsersManagement'
import AuditLogs from './pages/admin/AuditLogs'
import PageDetail from './pages/PageDetail'
import PostDetail from './pages/PostDetail'

function getPath() {
  return window.location.pathname.replace(/^\/dalimgari/, '').replace(/\/$/, '') || '/'
}

export default function App() {
  const path = getPath()
  const pageMatch = path.match(/^\/pages\/([^/]+)$/)
  const postMatch = path.match(/^\/posts\/([^/]+)$/)

  if (pageMatch) return <PageDetail slug={decodeURIComponent(pageMatch[1])} />
  if (postMatch) return <PostDetail postId={decodeURIComponent(postMatch[1])} />
  if (path === '/posts') return <Posts />
  if (path === '/albums') return <Albums />
  if (path === '/search') return <Search />
  if (path === '/login') return <Login />
  if (path === '/admin/pages') return <PagesManagement />
  if (path === '/admin/posts') return <PostsManagement />
  if (path === '/admin/albums') return <AlbumsManagement />
  if (path === '/admin/media') return <MediaManagement />
  if (path === '/admin/users') return <UsersManagement />
  if (path === '/admin/audit') return <AuditLogs />
  if (path === '/admin' || path === '/admin/website-information') return <ControlPanel />
  return <Home />
}
