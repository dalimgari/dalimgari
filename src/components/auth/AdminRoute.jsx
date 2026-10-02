import { useEffect, useState } from 'react'
import { useAuth } from '../../context'
import { hasPermission, canAccessRoute } from '../../services/permissionService'
import { appPath } from '../../lib/routes'
import Skeleton from '../ui/Skeleton'

export default function AdminRoute({ permission, routePath, children }) {
  const { user, status } = useAuth()
  const [allowed, setAllowed] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    let active = true
    async function checkAccess() {
      if (status !== 'ready') return
      if (!user) { if (active) { setAllowed(false); setChecking(false) }; return }
      setChecking(true)
      try {
        const permitted = routePath ? await canAccessRoute(routePath) : permission ? await hasPermission(permission) : await hasPermission('dashboard_view')
        if (active) setAllowed(permitted)
      } catch { if (active) setAllowed(false) } finally { if (active) setChecking(false) }
    }
    checkAccess()
    return () => { active = false }
  }, [permission, routePath, status, user?.id])

  useEffect(() => {
    if (status === 'ready' && !checking && (!user || !allowed)) {
      if (!user) {
        const base = import.meta.env.BASE_URL || '/'
        const next = window.location.pathname + (window.location.search || '')
        window.location.replace(base + 'login?next=' + encodeURIComponent(next))
      } else window.location.replace(appPath('/access-denied'))
    }
  }, [allowed, checking, status, user])

  if (status !== 'ready' || checking || !user || !allowed) return <Skeleton variant="page" />
  return children
}
