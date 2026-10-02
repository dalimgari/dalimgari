import { useEffect, useState } from 'react'
import { useAuth } from '../../context'
import { hasPermission } from '../../services/permissionService'
import { getAnalyticsSummary } from '../../services/analyticsService'
import { AdminLayout } from '../../components/admin'
import { Loading, ErrorState } from '../../components/ui'

export default function Analytics() {
  const { user, status } = useAuth()
  const [allowed, setAllowed] = useState(false)
  const [ready, setReady] = useState(false)
  const [summary, setSummary] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (status === 'loading') return
    if (!user) { window.location.href = (import.meta.env.BASE_URL || '/') + 'login'; return }
    let active = true
    hasPermission('audit_view').then((permission) => {
      if (!active) return
      setAllowed(permission)
      if (!permission) { setReady(true); return null }
      return getAnalyticsSummary(30)
    }).then((data) => {
      if (!active) return
      if (data) setSummary(data)
      setReady(true)
    }).catch((requestError) => { if (active) { setError(requestError); setReady(true) } })
    return () => { active = false }
  }, [status, user])

  if (status === 'loading' || !ready) return <Loading />
  if (!allowed) return <ErrorState description="আপনার পরিসংখ্যান দেখার অনুমতি নেই।" />
  if (error) return <AdminLayout user={user} title="পরিসংখ্যান"><ErrorState description={error.message || 'পরিসংখ্যান লোড করা যায়নি।'} /></AdminLayout>

  return <AdminLayout user={user} title="পরিসংখ্যান">
    <p className="admin-intro">গত ৩০ দিনের ওয়েবসাইট ব্যবহারের সংক্ষিপ্ত তথ্য। কাঁচা IP ঠিকানা সংগ্রহ করা হয় না।</p>
    <div className="content-grid">
      <article className="content-card"><h3>পৃষ্ঠা দেখা</h3><p>{summary?.total ?? 0}</p></article>
      <article className="content-card"><h3>দেখা পৃষ্ঠা</h3><p>{summary?.byPath?.length ?? 0}</p></article>
    </div>
    <section className="admin-form" style={{ marginTop: '1rem' }}>
      <h3>পথ অনুযায়ী দেখা</h3>
      {summary?.byPath?.length ? <ul>{summary.byPath.map(([path, count]) => <li key={path}><strong>{path}</strong> — {count}</li>)}</ul> : <p>এখনও কোনো পরিসংখ্যান নেই।</p>}
    </section>
  </AdminLayout>
}