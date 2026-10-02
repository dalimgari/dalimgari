import { useEffect, useMemo, useState } from 'react'
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

const MODULES = [
  ['pages', 'পেজ', 'content_manage', listManagedPages],
  ['posts', 'পোস্ট', 'content_manage', listManagedPosts],
  ['albums', 'অ্যালবাম', 'media_manage', listManagedAlbums],
  ['media', 'মিডিয়া', 'media_manage', listManagedMedia],
  ['users', 'ইউজার', 'user_manage', listManagedUsers],
  ['audit', 'অডিট লগ', 'audit_view', listAuditLogs],
]

function formatValue(value) {
  if (value == null || value === '') return '—'
  if (typeof value === 'object') {
    try { return JSON.stringify(value) } catch { return '—' }
  }
  return String(value)
}

function ModuleData({ label, items }) {
  if (!items.length) return <div className="ui-empty">এই মডিউলে বর্তমানে কোনো তথ্য নেই।</div>

  return (
    <div className="admin-module-data" style={{ display: 'grid', gap: '.65rem' }}>
      {items.map((item, index) => {
        const entries = Object.entries(item || {}).filter(([, value]) => value !== undefined).slice(0, 6)
        return (
          <article key={item?.id || item?.slug || item?.key || index} className="ui-state" style={{ padding: '.8rem' }}>
            <strong style={{ display: 'block', marginBottom: '.45rem' }}>{item?.title || item?.name || item?.label || `${label} #${index + 1}`}</strong>
            <div style={{ display: 'grid', gap: '.25rem', fontSize: '.86rem' }}>
              {entries.map(([key, value]) => (
                <div key={key} style={{ display: 'grid', gridTemplateColumns: 'minmax(7rem, 12rem) minmax(0, 1fr)', gap: '.5rem' }}>
                  <span style={{ color: 'var(--color-muted)' }}>{key}</span>
                  <span style={{ overflowWrap: 'anywhere' }}>{formatValue(value)}</span>
                </div>
              ))}
            </div>
          </article>
        )
      })}
    </div>
  )
}

export default function Dashboard() {
  const { user, status } = useAuth()
  const [moduleData, setModuleData] = useState({})
  const [allowedModules, setAllowedModules] = useState([])
  const [selectedKey, setSelectedKey] = useState(null)
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
        MODULES.map(async ([key, label, permission, loader]) => ({ key, label, permission, loader, allowed: await hasPermission(permission) }))
      )
      const allowed = permissions.filter((module) => module.allowed)
      const initial = Object.fromEntries(allowed.map(({ key }) => [key, []]))
      if (!active) return
      setAllowedModules(allowed)
      setModuleData(initial)
      setSelectedKey(allowed[0]?.key || null)
      setReady(true)

      const results = await Promise.allSettled(allowed.map(async ({ key, loader }) => [key, await loader()]))
      if (!active) return
      const next = { ...initial }
      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          const [key, data] = result.value
          next[key] = Array.isArray(data) ? data : []
        }
      })
      setModuleData(next)
    }

    loadDashboard().catch((requestError) => {
      if (!active) return
      setError(requestError)
      setReady(true)
    })

    return () => { active = false }
  }, [status, user])

  const selected = useMemo(() => allowedModules.find(([key]) => key === selectedKey), [allowedModules, selectedKey])
  const selectedLabel = selected?.[1] || 'মডিউল'
  const selectedItems = moduleData[selectedKey] || []

  if (status === 'loading' || !ready) return <Loading />
  if (error) return <AdminLayout user={user} title="ড্যাশবোর্ড"><ErrorState description={error.message || 'ড্যাশবোর্ড লোড করা যায়নি।'} /></AdminLayout>

  return (
    <AdminLayout user={user} title="ড্যাশবোর্ড">
      <div className="admin-management" style={{ gap: '1rem' }}>
        <div className="admin-dashboard-modules" role="tablist" aria-label="অ্যাডমিন মডিউল" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(9rem, 1fr))', gap: '.65rem' }}>
          {allowedModules.map(([key, label]) => {
            const active = key === selectedKey
            const count = moduleData[key]?.length ?? 0
            return (
              <button
                type="button"
                role="tab"
                key={key}
                className={`ui-button${active ? '' : ' ui-button--secondary'}`}
                aria-selected={active}
                onClick={() => setSelectedKey(key)}
                style={{ minHeight: '4.2rem', display: 'grid', gap: '.15rem', justifyItems: 'center', alignContent: 'center' }}
              >
                <span>{label}</span>
                <strong>{count}</strong>
              </button>
            )
          })}
        </div>

        {selected && (
          <section className="ui-state" role="tabpanel" aria-live="polite">
            <div className="section-heading" style={{ marginBottom: '.8rem' }}>
              <div>
                <p className="section-kicker">মডিউল তথ্য</p>
                <h2>{selectedLabel}</h2>
              </div>
            </div>
            <ModuleData label={selectedLabel} items={selectedItems} />
          </section>
        )}
      </div>
    </AdminLayout>
  )
}
