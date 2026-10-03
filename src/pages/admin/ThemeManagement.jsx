import { useEffect, useState } from 'react'
import { useAuth } from '../../context'
import { hasPermission } from '../../services/permissionService'
import { AdminLayout } from '../../components/admin'
import ThemeSettingsPanel from '../../components/admin/ThemeSettingsPanel'
import { Loading, ErrorState } from '../../components/ui'

export default function ThemeManagement() {
  const { user, status } = useAuth()
  const [allowed, setAllowed] = useState(false)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (status === 'loading') return
    if (!user) {
      window.location.href = (import.meta.env.BASE_URL || '/') + 'login'
      return
    }
    hasPermission('settings_manage')
      .then((permission) => { setAllowed(permission); setReady(true) })
      .catch((requestError) => { setError(requestError); setReady(true) })
  }, [status, user])

  if (status === 'loading' || !ready) return <Loading />
  if (error) return <ErrorState description={error.message || 'থিম ম্যানেজমেন্ট লোড করা যায়নি।'} />
  if (!allowed) return <ErrorState description="আপনার থিম পরিবর্তনের অনুমতি নেই।" />

  return (
    <AdminLayout user={user} title="Theme Management">
      <ThemeSettingsPanel />
    </AdminLayout>
  )
}
