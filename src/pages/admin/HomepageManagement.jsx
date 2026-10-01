import { useEffect, useState } from 'react'
import { useAuth } from '../../context'
import { hasPermission } from '../../services/permissionService'
import { getHomepageSettings, saveHomepageSettings } from '../../services/homepageService'
import { createAuditLog } from '../../services/auditService'
import { AdminLayout } from '../../components/admin'
import { Button, Input, Checkbox, Loading, ErrorState } from '../../components/ui'

export default function HomepageManagement() {
  const { user, status } = useAuth()
  const [allowed, setAllowed] = useState(false)
  const [ready, setReady] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [config, setConfig] = useState(null)

  useEffect(() => {
    if (status === 'loading') return
    if (!user) { window.location.href = (import.meta.env.BASE_URL || '/') + 'login'; return }
    Promise.all([hasPermission('homepage_manage'), getHomepageSettings()])
      .then(([permission, settings]) => { setAllowed(permission); setConfig(settings); setReady(true) })
      .catch(e => { setError(e); setReady(true) })
  }, [status, user])

  const update = (section, key, value) => setConfig(c => ({ ...c, [section]: { ...c[section], [key]: value } }))

  async function handleSave(e) {
    e.preventDefault(); setSaving(true); setError(null)
    try {
      const saved = await saveHomepageSettings(config)
      setConfig(saved)
      await createAuditLog({ actionKey: 'update', module: 'homepage', details: { settings: saved } })
    } catch (e) { setError(e) } finally { setSaving(false) }
  }

  if (status === 'loading' || !ready) return <Loading />
  if (!allowed) return <ErrorState description="আপনার হোমপেজ ম্যানেজমেন্টের অনুমতি নেই।" />

  return <AdminLayout user={user} title="হোমপেজ ম্যানেজমেন্ট">
    <form className="admin-management" onSubmit={handleSave}>
      <p className="admin-intro">Hero, ট্যাব, সেকশন, Gallery, কার্ড ও Sidebar-এর কনটেন্ট এক জায়গা থেকে পরিচালনা করুন।</p>

      <section className="admin-form">
        <h3>Hero</h3>
        <Checkbox id="hero-enabled" label="Hero দেখান" checked={config.hero.enabled !== false} onChange={e => update('hero','enabled',e.target.checked)} />
        <Input id="hero-title" label="Hero শিরোনাম" value={config.hero.title || ''} onChange={e => update('hero','title',e.target.value)} />
        <Input id="hero-subtitle" label="Hero উপশিরোনাম" value={config.hero.subtitle || ''} onChange={e => update('hero','subtitle',e.target.value)} />
        <Checkbox id="hero-slogan" label="Slogan দেখান" checked={config.hero.showSlogan !== false} onChange={e => update('hero','showSlogan',e.target.checked)} />
      </section>

      <section className="admin-form">
        <h3>হোমপেজ সেকশন</h3>
        <Checkbox id="info-enabled" label="গ্রামের তথ্য" checked={config.information.enabled !== false} onChange={e => update('information','enabled',e.target.checked)} />
        <Checkbox id="posts-enabled" label="পোস্ট" checked={config.posts.enabled !== false} onChange={e => update('posts','enabled',e.target.checked)} />
        <Input id="posts-title" label="পোস্ট শিরোনাম" value={config.posts.title || ''} onChange={e => update('posts','title',e.target.value)} />
        <Input id="posts-limit" type="number" min="1" max="30" label="পোস্ট সংখ্যা" value={config.posts.limit || 6} onChange={e => update('posts','limit',Number(e.target.value) || 6)} />
        <Checkbox id="gallery-enabled" label="ছবি ও ভিডিও Gallery" checked={config.mediaGallery.enabled !== false} onChange={e => update('mediaGallery','enabled',e.target.checked)} />
        <Input id="gallery-title" label="Gallery শিরোনাম" value={config.mediaGallery.title || ''} onChange={e => update('mediaGallery','title',e.target.value)} />
        <Input id="gallery-subtitle" label="Gallery উপশিরোনাম" value={config.mediaGallery.subtitle || ''} onChange={e => update('mediaGallery','subtitle',e.target.value)} />
        <Checkbox id="albums-enabled" label="অ্যালবাম" checked={config.albums.enabled !== false} onChange={e => update('albums','enabled',e.target.checked)} />
        <Input id="albums-limit" type="number" min="1" max="20" label="অ্যালবাম সংখ্যা" value={config.albums.limit || 4} onChange={e => update('albums','limit',Number(e.target.value) || 4)} />
      </section>

      <section className="admin-form">
        <h3>Sidebar</h3>
        <Checkbox id="sidebar-enabled" label="Sidebar দেখান" checked={config.sidebar.enabled !== false} onChange={e => update('sidebar','enabled',e.target.checked)} />
        <p className="admin-intro">Sidebar-এর links ও cards নিচের JSON কনফিগারেশন দিয়ে পরিচালনা করা যাবে।</p>
        <textarea className="ui-input" rows="12" value={JSON.stringify({ items: config.sidebar.items || [], cards: config.sidebar.cards || [] }, null, 2)} onChange={e => {
          try { const v=JSON.parse(e.target.value); setConfig(c => ({...c, sidebar:{...c.sidebar, ...v}})); setError(null) } catch { setError(new Error('Sidebar JSON সঠিক নয়।')) }
        }} />
      </section>

      <section className="admin-form">
        <h3>বিষয়ভিত্তিক ট্যাব</h3>
        <Checkbox id="tabs-enabled" label="ট্যাব দেখান" checked={config.topicTabs.enabled !== false} onChange={e => update('topicTabs','enabled',e.target.checked)} />
        <textarea className="ui-input" rows="14" value={JSON.stringify(config.topicTabs.items || [], null, 2)} onChange={e => {
          try { const items=JSON.parse(e.target.value); if(!Array.isArray(items)) throw new Error(); setConfig(c => ({...c, topicTabs:{...c.topicTabs,items}})); setError(null) } catch { setError(new Error('ট্যাবের JSON সঠিক নয়।')) }
        }} />
      </section>

      <div className="admin-form__actions"><Button type="submit" disabled={saving}>{saving ? 'সংরক্ষণ হচ্ছে…' : 'হোমপেজ সেটিংস সংরক্ষণ করুন'}</Button></div>
      {error ? <ErrorState description={error.message || 'সেটিংস সংরক্ষণ করা যায়নি।'} /> : null}
    </form>
  </AdminLayout>
}
