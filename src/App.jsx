import Home from './pages/Home'
import Posts from './pages/Posts'
import Albums from './pages/Albums'
import Search from './pages/Search'
import Login from './pages/Login'
import ControlPanel from './pages/ControlPanel'

function getPath() {
  return window.location.pathname.replace(/^\/dalimgari/, '').replace(/\/$/, '') || '/'
}

export default function App() {
  const path = getPath()

  if (path === '/posts') return <Posts />
  if (path === '/albums') return <Albums />
  if (path === '/search') return <Search />
  if (path === '/login') return <Login />
  if (path === '/admin') return <ControlPanel />

  return <Home />
}
