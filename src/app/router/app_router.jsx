import { Routes, Route } from 'react-router-dom'
import { public_page } from '../../page/public/public_page'

export function app_router() {
  return (
    <Routes>
      <Route path="*" element={<public_page />} />
    </Routes>
  )
}
