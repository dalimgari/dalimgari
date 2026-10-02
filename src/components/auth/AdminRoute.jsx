import { useEffect, useState } from 'react'
import { useAuth } from '../../context'
import { hasPermission, canAccessRoute } from '../../services/permissionService'
import { appPath } from '../../lib/routes'
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
        if (active) {
          setAllowed(false)
          setChecking(false)
        }
        return
      }

      setChecking(true)

      // A deployment must never turn a still-valid login session into an
      // access-denied state merely because route metadata is temporarily
      // unavailable. Verify the route first, then fall back to the explicit
      // permission required by this frontend route.
      let permitted = false

      for (let attempt = 0; attempt < 2 && active && !permitted; attempt += 1) {
        try {
          if (routePath) permitted = await canAccessRoute(routePath)
          if (!permitted && permission) permitted = await hasPermission(permission)
          if (!permitted && !routePath && !permission) permitted = await hasPermission('dashboard_view')
        } catch {
          if (attempt === 0) await new Promise(resolve => setTimeout(resolve, 250))
        }
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
      window.location.replace(base + 'login?next=' + encodeURIComponent(currentNextPath()))
      return
    }

    if (!allowed) window.location.replace(appPath('/access-denied'))
  }, [allowed, checking, status, user])

  if (status !== 'ready' || checking || !user || !allowed) return <Skeleton variant="page" />
  return children
}
