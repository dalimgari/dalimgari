import { useEffect, useState } from 'react'
import { useAuth } from '../../context'
import { hasPermission } from '../../services/permissionService'
import { getHomepageSettings, saveHomepageSettings } from '../../services/homepageService'
import { listPublishedPages } from '../../services/pageService'
import { createAuditLog } from '../../services/auditService'
import { AdminLayout } from '../../components/admin'
import { Button, Input, Checkbox, Loading, ErrorState } from '../../components/ui'

function togglePage(list, pageId) {
  const exists = list.some((item) => item.page_id === pageId)
  return exists ? list.filter((item) => item.page_id !== pageId) : [...list, { page_id: pageId, enabled: true }]
}

export default function HomepageManagement() {
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
    Promise.all([hasPermission('homepage_manage'), getHomepageSettings(), listPublishedPages()])
      .then(([permission, settings, publishedPages]) => {
        setAllowed(permission)
        setConfig(settings)
        setPages(publishedPages)
        setReady(true)
      })
      .catch((e) => { setError(e); setReady(true) })
  }, [status, user])

  const update = (section, key, value) => setConfig((c) => ({ ...c, [section]: { ...c[section], [key]: value } }))

  function selectTabPage(pageId) {
    setConfig((c) => ({ ...c, topicTabs: { ...c.topicTabs, items: togglePage(c.topicTabs.items || [], pageId) } }))
  }

  function selectCardPage(pageId) {
    setConfig((c) => ({ ...c, pageCards: { ...c.pageCards, items: togglePage(c.pageCards.items || [], pageId) } }))
  }

  function moveItem(section, index, direction) {
    setConfig((c) => {
      const items = [...(c[section]?.items || [])]
      const target = index + direction
      if (target < 0 || target >= items.length) return c
      ;[items[index], items[target]] = [items[target], items[index]]
      return { ...c, [section]: { ...c[section], items } }
    })
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true); setError(null)
    try {
      const saved = await saveHomepageSettings(config)
      setConfig(saved)
      await createAuditLog({ actionKey: 'update', module: 'homepage', details: { settings: saved } })
    } catch (e) { setError(e) } finally { setSaving(false) }
  }

  const selectedTabs = config?.topicTabs?.items || []
  const selectedCards = config?.pageCards?.items || []

  if (status === 'loading' || !ready) return <Loading />
  if (!allowed) return <ErrorState description="আপনার হোমপেজ ম্যানেজমেন্টের অনুমতি নেই।" />

  return <AdminLayout user={user} title="হোমপেজ ম্যানেজমেন্ট">
    <form className="admin-management" onSubmit={handleSave}>
      <p className="admin-intro">একাধিক পেজ তৈরি করে সেগুলোকে হোমপেজের ট্যাব বা কার্ড হিসেবে সাজানো যাবে। ট্যাব/কার্ডের নিজস্ব তথ্য নেই; সব তথ্য মূল পেজ থেকেই আসে।</p>

      <section className="admin-form">
        <h3>Hero</h3>
        <Checkbox id="hero-enabled" label="Hero দেখান" checked={config.hero.enabled !== false} onChange={(e) => update('hero', 'enabled', e.target.checked)} />
        <Input id="hero-title" label="Hero শিরোনাম" value={config.hero.title || ''} onChange={(e) => update('hero', 'title', e.target.value)} />
        <Input id="hero-subtitle" label="Hero উপশিরোনাম" value={config.hero.subtitle || ''} onChange={(e) => update('hero', 'subtitle', e.target.value)} />
        <Checkbox id="hero-slogan" label="Slogan দেখান" checked={config.hero.showSlogan !== false} onChange={(e) => update('hero', 'showSlogan', e.target.checked)} />
      </section>

      <section className="admin-form">
        <h3>পেজ → ট্যাব</h3>
        <Checkbox id="tabs-enabled" label="ট্যাব দেখান" checked={config.topicTabs.enabled !== false} onChange={(e) => update('topicTabs', 'enabled', e.target.checked)} />
        <p className="admin-intro">নিচের প্রকাশিত পেজগুলো নির্বাচন করুন। ট্যাবে পেজের শিরোনাম দেখাবে এবং ক্লিক করলে সরাসরি সেই পেজে যাবে।</p>
        <div className="admin-list">
          {pages.map((page) => {
            const selected = selectedTabs.some((item) => item.page_id === page.page_id)
            return <div className="admin-list__item" key={page.page_id}>
              <Checkbox id={`tab-page-${page.page_id}`} label={page.page_title} checked={selected} onChange={() => selectTabPage(page.page_id)} />
              <div className="admin-list__actions">
                {selected ? <Button type="button" variant="secondary" onClick={() => moveItem('topicTabs', selectedTabs.findIndex((item) => item.page_id === page.page_id), -1)}>↑</Button> : null}
                {selected ? <Button type="button" variant="secondary" onClick={() => moveItem('topicTabs', selectedTabs.findIndex((item) => item.page_id === page.page_id), 1)}>↓</Button> : null}
              </div>
            </div>
          })}
        </div>
      </section>

      <section className="admin-form">
        <h3>পেজ → কার্ড</h3>
        <Checkbox id="cards-enabled" label="কার্ড দেখান" checked={config.pageCards?.enabled !== false} onChange={(e) => update('pageCards', 'enabled', e.target.checked)} />
        <Input id="cards-title" label="কার্ড সেকশনের শিরোনাম" value={config.pageCards?.title || ''} onChange={(e) => update('pageCards', 'title', e.target.value)} />
        <Input id="cards-limit" type="number" min="1" max="50" label="কার্ড সংখ্যা" value={config.pageCards?.limit || 8} onChange={(e) => update('pageCards', 'limit', Number(e.target.value) || 8)} />
        <p className="admin-intro">কার্ডেও আলাদা তথ্য লেখা যাবে না। কার্ড শুধু সংশ্লিষ্ট পেজে নিয়ে যাবে।</p>
        <div className="admin-list">
          {pages.map((page) => {
            const selected = selectedCards.some((item) => item.page_id === page.page_id)
            return <div className="admin-list__item" key={page.page_id}>
              <Checkbox id={`card-page-${page.page_id}`} label={page.page_title} checked={selected} onChange={() => selectCardPage(page.page_id)} />
              <div className="admin-list__actions">
                {selected ? <Button type="button" variant="secondary" onClick={() => moveItem('pageCards', selectedCards.findIndex((item) => item.page_id === page.page_id), -1)}>↑</Button> : null}
                {selected ? <Button type="button" variant="secondary" onClick={() => moveItem('pageCards', selectedCards.findIndex((item) => item.page_id === page.page_id), 1)}>↓</Button> : null}
              </div>
            </div>
          })}
        </div>
      </section>

      <section className="admin-form">
        <h3>হোমপেজ সেকশন</h3>
        <Checkbox id="info-enabled" label="গ্রামের তথ্য" checked={config.information.enabled !== false} onChange={(e) => update('information', 'enabled', e.target.checked)} />
        <Checkbox id="posts-enabled" label="পোস্ট" checked={config.posts.enabled !== false} onChange={(e) => update('posts', 'enabled', e.target.checked)} />
        <Input id="posts-title" label="পোস্ট শিরোনাম" value={config.posts.title || ''} onChange={(e) => update('posts', 'title', e.target.value)} />
        <Input id="posts-limit" type="number" min="1" max="30" label="পোস্ট সংখ্যা" value={config.posts.limit || 6} onChange={(e) => update('posts', 'limit', Number(e.target.value) || 6)} />
        <Checkbox id="gallery-enabled" label="ছবি ও ভিডিও Gallery" checked={config.mediaGallery.enabled !== false} onChange={(e) => update('mediaGallery', 'enabled', e.target.checked)} />
        <Input id="gallery-title" label="Gallery শিরোনাম" value={config.mediaGallery.title || ''} onChange={(e) => update('mediaGallery', 'title', e.target.value)} />
        <Input id="gallery-subtitle" label="Gallery উপশিরোনাম" value={config.mediaGallery.subtitle || ''} onChange={(e) => update('mediaGallery', 'subtitle', e.target.value)} />
        <Checkbox id="albums-enabled" label="অ্যালবাম" checked={config.albums.enabled !== false} onChange={(e) => update('albums', 'enabled', e.target.checked)} />
        <Input id="albums-limit" type="number" min="1" max="20" label="অ্যালবাম সংখ্যা" value={config.albums.limit || 4} onChange={(e) => update('albums', 'limit', Number(e.target.value) || 4)} />
      </section>

<div className="admin-form__actions"><Button type="submit" disabled={saving}>{saving ? 'সংরক্ষণ হচ্ছে…' : 'হোমপেজ সেটিংস সংরক্ষণ করুন'}</Button></div>
      {error ? <ErrorState description={error.message || 'সেটিংস সংরক্ষণ করা যায়নি।'} /> : null}
    </form>
  </AdminLayout>
}
