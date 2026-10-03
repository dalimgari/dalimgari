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
import { ROUTES, appPath } from './lib/routes'
import { MANAGEMENT_ROUTE_BY_PATH } from './config/routeDefinitions'

function getPath() {
  const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '')
  let path = window.location.pathname
  if (base && path.startsWith(base)) path = path.slice(base.length)
  return path.replace(/\/$/, '') || '/'
}

const managementComponents = {
  homepage: HomepageManagement,
  sidebar: SidebarManagement,
  pages: PagesManagement,
  posts: PostsManagement,
  albums: AlbumsManagement,
  media: MediaManagement,
  users: UsersManagement,
  access: AccessManagement,
  audit: AuditLogs,
  analytics: Analytics,
  websiteInformation: ControlPanel,
  adminInformation: AdminInformationManagement,
  databaseStorage: DatabaseStorageInformation,
  ruralVisual: RuralVisualManagement,
  keyLabels: KeyLabelManagement,
  translationOverrides: TranslationOverrideManagement,
  icons: IconManagement,
}

const legacyPaths = ROUTES.legacy


function getRedirectTarget(path) {
  if (legacyPaths[path]) return legacyPaths[path]
  if (path === ROUTES.profile) return ROUTES.dashboard
  if (/^\/(admin|manager|editor|moderator|user)\/profile$/.test(path)) return ROUTES.dashboard
  if (path.startsWith(ROUTES.dashboard + '/') && /\/(admin|manager|editor|moderator|user)$/.test(path)) return ROUTES.dashboard
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
  const pageMatch = path.match(new RegExp(`^${ROUTES.pageDetailPrefix}/([^/]+)$`))
  const albumMatch = path.match(new RegExp(`^${ROUTES.albumDetailPrefix}/([^/]+)$`))
  const postMatch = path.match(new RegExp(`^${ROUTES.postDetailPrefix}/([^/]+)$`))
  const management = MANAGEMENT_ROUTE_BY_PATH[path]

  if (path === ROUTES.dashboard) page = <RoleRoute />
  else if (management) {
    const Component = managementComponents[management.key]
    page = Component ? <AdminRoute permission={management.permission} routePath={path}><Component /></AdminRoute> : <NotFound />
  } else if (path === ROUTES.accessDenied) page = <AccessDenied />
  else if (pageMatch) page = <PageDetail slug={decodeURIComponent(pageMatch[1])} />
  else if (albumMatch) page = <AlbumDetail albumKey={decodeURIComponent(albumMatch[1])} />
  else if (postMatch) page = <PostDetail postId={decodeURIComponent(postMatch[1])} />
  else if (path === ROUTES.home) page = <Home />
  else if (path === ROUTES.posts) page = <Posts />
  else if (path === ROUTES.albums) page = <Albums />
  else if (path === ROUTES.information) page = <Information />
  else if (path === ROUTES.search) page = <SearchPage />
  else if (path === ROUTES.login) page = <Login />
  else if (path === ROUTES.signup) page = <Signup />
  else if (/^\/[^/]+$/.test(path)) page = <PageDetail slug={decodeURIComponent(path.slice(1))} />

  return page
}
