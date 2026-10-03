import { useEffect, useState } from 'react'
import { useAuth } from '../../context'
import { hasPermission, canAccessRoute, hasAdminAccess } from '../../services/permissionService'
import { ROUTES, PERMISSIONS, appPath } from '../../lib/routes'
import Skeleton from '../ui/Skeleton'

function currentNextPath() {
  return window.location.pathname + (window.location.search || '') + (window.location.hash || '')
}

export default function AdminRoute({ permission, routePath, children }) {
  const { user, status } = useAuth()
  const [allowed, setAllowed] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    let active = true

    async function checkAccess() {
      if (status !== 'ready') return
      if (!user) {
        if (active) { setAllowed(false); setChecking(false) }
        return
      }

      setChecking(true)
      let permitted = false

      try {
        // Admin is a privileged role: an authenticated admin always has full access.
        permitted = await hasAdminAccess()

        // Non-admin roles continue through the configurable permission system.
        if (!permitted) {
          if (routePath) permitted = await canAccessRoute(routePath)
          if (!permitted && permission) permitted = await hasPermission(permission)
          if (!permitted && !routePath && !permission) permitted = await hasPermission(PERMISSIONS.dashboardView)
        }
      } catch {
        permitted = false
      }

      if (active) setAllowed(Boolean(permitted))
      if (active) setChecking(false)
    }

    checkAccess()
    return () => { active = false }
  }, [permission, routePath, status, user?.id])

  useEffect(() => {
    if (status !== 'ready' || checking) return
    if (!user) {
      const base = import.meta.env.BASE_URL || '/'
      window.location.replace(base + ROUTES.login.slice(1) + '?next=' + encodeURIComponent(currentNextPath()))
      return
    }
    if (!allowed) window.location.replace(appPath(ROUTES.accessDenied))
  }, [allowed, checking, status, user])

  if (status !== 'ready' || checking || !user || !allowed) return <Skeleton variant="page" />
  return children
}
