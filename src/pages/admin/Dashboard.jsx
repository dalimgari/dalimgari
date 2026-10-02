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
import { appPath } from '../../lib/routes'
import { Loading, ErrorState } from '../../components/ui'

const CARDS = [
  ['pages', 'পেজ', 'content_manage', listManagedPages, '/admin/pages'],
  ['posts', 'পোস্ট', 'content_manage', listManagedPosts, '/admin/posts'],
  ['albums', 'অ্যালবাম', 'media_manage', listManagedAlbums, '/admin/albums'],
  ['media', 'মিডিয়া', 'media_manage', listManagedMedia, '/admin/media'],
  ['users', 'ইউজার', 'user_manage', listManagedUsers, '/admin/users'],
  ['audit', 'অডিট লগ', 'audit_view', listAuditLogs, '/admin/audit'],
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
    async function loadDashboard() {
      const permissions = await Promise.all(
        CARDS.map(async ([key, , permission, loader]) => ({ key, permission, loader, allowed: await hasPermission(permission) }))
      )
      const allowedCards = permissions.filter((card) => card.allowed)
      const results = await Promise.all(
        allowedCards.map(async ({ key, loader }) => {
          const data = await loader()
          return [key, Array.isArray(data) ? data.length : 0]
        })
      )
      const nextCounts = Object.fromEntries(permissions.map(({ key, allowed }) => [key, allowed ? undefined : null]))
      results.forEach(([key, value]) => { nextCounts[key] = value })
      if (!active) return
      setCounts(nextCounts)
      setReady(true)
    }

    loadDashboard().catch((requestError) => {
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
      <div className="content-grid admin-dashboard-grid">
        {CARDS.filter(([key]) => counts[key] !== null).map(([key, label, , , path]) => (
          <a className="admin-dashboard-module" key={key} href={appPath(path)}>
            <span>{label}</span>
            <strong>{counts[key] == null ? '—' : counts[key]}</strong>
          </a>
        ))}
      </div>
    </AdminLayout>
  )
}
