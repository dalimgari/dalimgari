import { useEffect, useState } from 'react'
import { useAuth } from '../../context'
import { appPath } from '../../lib/routes'
import { dashboardPathForRole, getCurrentRole } from '../../services/roleService'
import Skeleton from '../ui/Skeleton'
import { Layout } from '../layout'
import { ErrorState } from '../ui'
import AdminRoute from './AdminRoute'
import Profile from '../../pages/Profile'
import Dashboard from '../../pages/admin/Dashboard'

const ROLE_NAMES = { admin: 'অ্যাডমিন', manager: 'ম্যানেজার', editor: 'এডিটর', moderator: 'মডারেটর', user: 'ইউজার' }

export default function RoleRoute({ requestedRole = null }) {
  const { user, status } = useAuth()
  const [state, setState] = useState({ status: 'loading', role: null, error: null })

  useEffect(() => {
    let active = true
    if (status !== 'ready') return undefined
    if (!user) {
      window.location.replace(appPath('/login'))
      return undefined
    }

    async function resolve() {
      try {
        const role = await getCurrentRole()
        if (!active) return
        if (!role) {
          setState({ status: 'error', role: null, error: 'আপনার কোনো বৈধ রোল নির্ধারিত নেই।' })
          return
        }
        if (requestedRole && requestedRole !== role.key) {
          setState({ status: 'mismatch', role, error: `লিংকে চাওয়া রোল (${ROLE_NAMES[requestedRole] || requestedRole}) এবং আপনার বর্তমান রোল (${ROLE_NAMES[role.key] || role.key}) মিলছে না।` })
          return
        }
        setState({ status: 'ready', role, error: null })
      } catch (error) {
        if (active) setState({ status: 'error', role: null, error: error?.message || 'রোল শনাক্ত করা যায়নি।' })
      }
    }
    resolve()
    return () => { active = false }
  }, [status, user?.id, requestedRole])

  useEffect(() => {
    if (state.status !== 'ready') return
    const target = appPath(dashboardPathForRole(state.role.key))
    const current = window.location.pathname.replace(/\/$/, '') || '/'
    if (current !== target) window.location.replace(target)
  }, [state])

  if (status !== 'ready' || state.status === 'loading') return <Skeleton variant="page" />
  if (state.status === 'mismatch' || state.status === 'error') {
    return <Layout seoTitle="অ্যাক্সেস ত্রুটি"><section className="home-section"><div className="site-container"><ErrorState title="রোল মিলছে না" description={state.error} onRetry={() => window.location.replace(appPath('/dashboard'))} /></div></section></Layout>
  }
  if (state.status !== 'ready') return <Skeleton variant="page" />
  if (state.role.key === 'admin') return <AdminRoute><Dashboard /></AdminRoute>
  return <Profile />
}
