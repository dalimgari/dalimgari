import { useEffect, useState } from 'react'
import { ROUTES, appPath } from '../../lib/routes'
import { useAuth } from '../../context'
import { getCurrentRole } from '../../services/roleService'
import Skeleton from '../ui/Skeleton'
import { Layout } from '../layout'
import { ErrorState } from '../ui'
import Dashboard from '../../pages/admin/Dashboard'

export default function RoleRoute() {
  const { user, status } = useAuth()
  const [state, setState] = useState({ status: 'loading', role: null, error: null })

  useEffect(() => {
    let active = true
    if (status !== 'ready') return undefined

    if (!user) {
      window.location.replace(appPath(ROUTES.login))
      return undefined
    }

    async function resolve() {
      try {
        const role = await getCurrentRole()
        if (!active) return
        if (!role) {
          setState({ status: 'error', role: null, error: 'আপনার অ্যাকাউন্টের কোনো বৈধ রোল পাওয়া যায়নি।' })
          return
        }
        setState({ status: 'ready', role, error: null })
      } catch (error) {
        if (active) setState({ status: 'error', role: null, error: error?.message || 'রোল যাচাই করা যায়নি।' })
      }
    }

    resolve()
    return () => { active = false }
  }, [status, user?.id])

  if (status !== 'ready' || state.status === 'loading') return <Skeleton variant="page" />
  if (!user) return <Skeleton variant="page" />
  if (state.status === 'error') {
    return <Layout seoTitle="অ্যাক্সেস ত্রুটি"><section className="home-section"><div className="site-container"><ErrorState title="অ্যাক্সেস ত্রুটি" description={state.error} onRetry={() => window.location.reload()} /></div></section></Layout>
  }

  // Role has been verified before Dashboard is mounted, so dashboard data
  // loaders cannot run before the authenticated account/role check completes.
  return <Dashboard verifiedRole={state.role} />
}
