import { Routes, Route } from 'react-router-dom'
import { PublicPage } from '../../page/public/PublicPage'

export function AppRouter() {
  return (
    <Routes>
      <Route path="*" element={<PublicPage />} />
    </Routes>
  )
}
