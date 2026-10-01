import { useEffect, useState } from 'react'
import { useAuth } from '../../context'
import { hasPermission } from '../../services/permissionService'
import { listManagedPages } from '../../services/pageService'
import { listManagedPosts } from '../../services/postService'
import { listManagedAlbums } from '../../services/albumService'
import { listManagedMedia } from '../../services/mediaService'
import { listManagedUsers } from '../../services/userService'
import { listAuditLogs } from '../../services/auditService'
import { AdminLayout } from '../../components/admin'
import { Loading, ErrorState } from '../../components/ui'

const CARDS = [
  ['pages', 'পেজ', 'content_manage', listManagedPages],
  ['posts', 'পোস্ট', 'content_manage', listManagedPosts],
  ['albums', 'অ্যালবাম', 'media_manage', listManagedAlbums],
  ['media', 'মিডিয়া', 'media_manage', listManagedMedia],
  ['users', 'ইউজার', 'user_manage', listManagedUsers],
  ['audit', 'অডিট লগ', 'audit_view', listAuditLogs],
]

export default function Dashboard() {
  const { user, status } = useAuth()
  const [counts, setCounts] = useState({})
  const [ready, setReady] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (status === 'loading') return
    if (!user) {
      window.location.href = (import.meta.env.BASE_URL || '/') + 'login'
      return
    }

    let active = true
    Promise.all(CARDS.map(async ([key, , permission, loader]) => {
      const allowed = await hasPermission(permission)
      if (!allowed) return [key, null]
      const data = await loader()
      return [key, Array.isArray(data) ? data.length : 0]
    }))
      .then((results) => {
        if (!active) return
        setCounts(Object.fromEntries(results))
        setReady(true)
      })
      .catch((requestError) => {
        if (!active) return
        setError(requestError)
        setReady(true)
      })

    return () => { active = false }
  }, [status, user])

  if (status === 'loading' || !ready) return <Loading />
  if (error) return <AdminLayout user={user} title="ড্যাশবোর্ড"><ErrorState description={error.message || 'ড্যাশবোর্ড লোড করা যায়নি।'} /></AdminLayout>

  return (
    <AdminLayout user={user} title="ড্যাশবোর্ড">
      <p className="admin-intro">বর্তমান সিস্টেমের অনুমোদিত তথ্যের সংক্ষিপ্তসার।</p>
      <div className="content-grid admin-dashboard-grid">
        {CARDS.map(([key, label]) => (
          <article className="content-card" key={key}>
            <p className="eyebrow">{label}</p>
            <p className="admin-dashboard-count">{counts[key] == null ? '—' : counts[key]}</p>
          </article>
        ))}
      </div>
    </AdminLayout>
  )
}
