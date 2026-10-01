import { useEffect, useState } from 'react'
import { useAuth } from '../../context'
import { hasPermission } from '../../services/permissionService'
import { getSidebarSettings, saveSidebarSettings } from '../../services/sidebarService'
import { listPublishedPages } from '../../services/pageService'
import { createAuditLog } from '../../services/auditService'
import { AdminLayout } from '../../components/admin'
import { Button, Checkbox, Loading, ErrorState } from '../../components/ui'

function togglePage(list, pageId) {
  const exists = list.some((item) => item.page_id === pageId)
  return exists ? list.filter((item) => item.page_id !== pageId) : [...list, { page_id: pageId, enabled: true }]
}

export default function SidebarManagement() {
  const { user, status } = useAuth()
  const [allowed, setAllowed] = useState(false)
  const [ready, setReady] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [config, setConfig] = useState(null)
  const [pages, setPages] = useState([])

  useEffect(() => {
    if (status === 'loading') return
    if (!user) { window.location.href = (import.meta.env.BASE_URL || '/') + 'login'; return }
    Promise.all([hasPermission('sidebar_manage'), getSidebarSettings(), listPublishedPages()])
      .then(([permission, settings, publishedPages]) => { setAllowed(permission); setConfig(settings); setPages(publishedPages); setReady(true) })
      .catch((e) => { setError(e); setReady(true) })
  }, [status, user])

  function selectPage(pageId) {
    setConfig((current) => ({ ...current, items: togglePage(current.items || [], pageId) }))
  }

  function moveItem(index, direction) {
    setConfig((current) => {
      const items = [...(current.items || [])]
      const target = index + direction
      if (target < 0 || target >= items.length) return current
      ;[items[index], items[target]] = [items[target], items[index]]
      return { ...current, items }
    })
  }

  async function handleSave(event) {
    event.preventDefault()
    setSaving(true); setError(null)
    try {
      const saved = await saveSidebarSettings(config)
      setConfig(saved)
      await createAuditLog({ actionKey: 'update', module: 'sidebar', details: { settings: saved } })
    } catch (e) { setError(e) } finally { setSaving(false) }
  }

  const selected = config?.items || []
  if (status === 'loading' || !ready) return <Loading />
  if (!allowed) return <ErrorState description="আপনার সাইডবার ম্যানেজমেন্টের অনুমতি নেই।" />

  return <AdminLayout user={user} title="সাইডবার ম্যানেজমেন্ট">
    <form className="admin-management" onSubmit={handleSave}>
      <p className="admin-intro">সাইডবারের মেনু এখান থেকে ঠিক করা যাবে। প্রকাশিত পেজ নির্বাচন করুন, তারপর ↑ ↓ দিয়ে মেনুর ক্রম সাজান। মেনুর নিজস্ব তথ্য নেই—প্রতিটি মেনু সংশ্লিষ্ট পেজকেই উপস্থাপন করবে।</p>
      <section className="admin-form">
        <h3>সাইডবার</h3>
        <Checkbox id="sidebar-enabled" label="সাইডবার চালু রাখুন" checked={config.enabled !== false} onChange={(e) => setConfig((current) => ({ ...current, enabled: e.target.checked }))} />
        <p className="admin-intro">‘বাড়ি’, ‘নিজের পরিচয়’, দিন/রাত ও ভাষার নিয়ন্ত্রণ আলাদা থাকবে। নিচের তালিকা শুধু সাইডবারের পেজ-মেনু নিয়ন্ত্রণ করে।</p>
        <div className="admin-list">
          {pages.map((page) => {
            const selectedIndex = selected.findIndex((item) => item.page_id === page.page_id)
            const isSelected = selectedIndex >= 0
            return <div className="admin-list__item" key={page.page_id}>
              <Checkbox id={'sidebar-page-' + page.page_id} label={page.page_title} checked={isSelected} onChange={() => selectPage(page.page_id)} />
              <div className="admin-list__actions">
                {isSelected ? <Button type="button" variant="secondary" disabled={selectedIndex === 0} onClick={() => moveItem(selectedIndex, -1)}>↑</Button> : null}
                {isSelected ? <Button type="button" variant="secondary" disabled={selectedIndex === selected.length - 1} onClick={() => moveItem(selectedIndex, 1)}>↓</Button> : null}
              </div>
            </div>
          })}
        </div>
        {!pages.length ? <p className="gallery-empty">কোনো প্রকাশিত পেজ নেই। আগে পেজ তৈরি ও প্রকাশ করুন।</p> : null}
      </section>
      <div className="admin-form__actions"><Button type="submit" disabled={saving}>{saving ? 'সংরক্ষণ হচ্ছে…' : 'সাইডবার সেটিংস সংরক্ষণ করুন'}</Button></div>
      {error ? <ErrorState description={error.message || 'সাইডবার সেটিংস সংরক্ষণ করা যায়নি।'} /> : null}
    </form>
  </AdminLayout>
}