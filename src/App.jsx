import Home from './pages/Home'
import Posts from './pages/Posts'
import Albums from './pages/Albums'
import Search from './pages/Search'

function getPath() {
  return window.location.pathname.replace(/^\/dalimgari/, '').replace(/\/$/, '') || '/'
}

export default function App() {
  const path = getPath()

  if (path === '/posts') return <Posts />
  if (path === '/albums') return <Albums />
  if (path === '/search') return <Search />

  return <Home />
}
