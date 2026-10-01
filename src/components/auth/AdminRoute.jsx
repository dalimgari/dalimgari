import { useEffect, useState } from 'react'
import { useAuth } from '../../context'
import { hasAdminAccess, hasPermission } from '../../services/permissionService'
import { appPath } from '../../lib/routes'
import Skeleton from '../ui/Skeleton'

export default function AdminRoute({ permission, children }) {
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
      try {
        const permitted = permission ? await hasPermission(permission) : await hasAdminAccess()
        if (active) setAllowed(permitted)
      } catch {
        if (active) setAllowed(false)
      } finally {
        if (active) setChecking(false)
      }
    }

    checkAccess()
    return () => { active = false }
  }, [permission, status, user?.id])

  useEffect(() => {
    if (status === 'ready' && !checking && (!user || !allowed)) {
      window.location.replace(appPath('/login'))
    }
  }, [allowed, checking, status, user])

  if (status !== 'ready' || checking) return <Skeleton variant="page" />
  if (!user || !allowed) return <Skeleton variant="page" />

  return children
}
