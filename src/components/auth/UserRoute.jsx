import { useEffect } from 'react'
import { useAuth } from '../../context'
import { appPath } from '../../lib/routes'
import Skeleton from '../global components/skeleton/Skeleton'

export default function UserRoute({ children }) {
  const { user, status } = useAuth()

  useEffect(() => {
    if (status === 'ready' && !user) window.location.replace(appPath('/login'))
  }, [status, user])

  if (status !== 'ready' || !user) return <Skeleton variant="page" />
  return children
}
