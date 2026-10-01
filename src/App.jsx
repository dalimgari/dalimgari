import Home from './pages/Home'
import Posts from './pages/Posts'
import Albums from './pages/Albums'

function getPath() {
  return window.location.pathname.replace(/^\/dalimgari/, '').replace(/\/$/, '') || '/'
}

export default function App() {
  const path = getPath()

  if (path === '/posts') return <Posts />
  if (path === '/albums') return <Albums />

  return <Home />
}
