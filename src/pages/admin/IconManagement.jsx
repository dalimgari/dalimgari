import { useEffect, useMemo, useState } from 'react'
import { AdminLayout } from '../../components/admin'
import { ErrorState, Loading } from '../../components/ui'
import { createAuditLog } from '../../services/auditService'
import { listIconManagement, uploadIconForKey } from '../../services/iconManagementService'
import { useAuth } from '../../context'

function normalize(value) { return String(value ?? '').replace(/\s+/g, ' ').trim() }

export default function IconManagement() {
  const { user } = useAuth()
  const [icons, setIcons] = useState([])
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(null)
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    let active = true
    listIconManagement().then((data) => { if (active) setIcons(data) }).catch((e) => { if (active) setError(e) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const suggestions = useMemo(() => {
    const needle = normalize(query).toLocaleLowerCase()
    if (!needle) return []
    return icons.filter((row) => normalize(row.key).toLocaleLowerCase().includes(needle)).slice(0, 20)
  }, [icons, query])

  function selectIcon(row) { setSelected(row); setQuery(row.key); setFile(null); setNotice(''); setError(null) }

  async function handleUpload(event) {
    event.preventDefault()
    if (!selected || !file) return
    setSaving(true); setError(null); setNotice('')
    try {
      const updated = await uploadIconForKey(selected.key, file)
      setIcons((current) => current.map((item) => item.key === updated.key ? updated : item))
      setSelected(updated)
      setFile(null)
      event.target.reset()
      setNotice('আইকন আপলোড ও সংরক্ষণ করা হয়েছে।')
      await createAuditLog({ actionKey: 'icon_uploaded', module: 'icon_management', details: { key: updated.key, file_name: file.name } }).catch(() => null)
    } catch (e) { setError(e) } finally { setSaving(false) }
  }

  if (loading) return <AdminLayout user={user} title="Icon Management"><Loading /></AdminLayout>
  if (error && !icons.length) return <AdminLayout user={user} title="Icon Management"><ErrorState description={error.message || 'আইকন তথ্য লোড করা যায়নি।'} /></AdminLayout>

  return <AdminLayout user={user} title="Icon Management">
    <div className="admin-management" style={{ display: 'grid', gap: '1rem' }}>
      <section className="ui-state">
        <div className="section-heading" style={{ marginBottom: '.8rem' }}><div><p className="section-kicker">Icon Management</p><h1>Key অনুযায়ী Icon Upload</h1><p style={{ margin: '.35rem 0 0', color: 'var(--color-muted)' }}>Key Management-এর মতো key খুঁজে নির্বাচন করুন, তারপর সেই key-এর জন্য SVG/PNG/WebP icon আপলোড করুন।</p></div></div>
        <label htmlFor="icon-key-search" style={{ display: 'grid', gap: '.4rem' }}><span>Key খোঁজ</span><input id="icon-key-search" className="ui-input" type="search" value={query} onChange={(e) => { setQuery(e.target.value); setSelected(null); setNotice(''); setError(null) }} placeholder="Key name" autoComplete="off" /></label>
        {normalize(query) && !selected && <div style={{ display: 'grid', gap: '.45rem', marginTop: '.65rem' }}>{suggestions.length ? suggestions.map((row) => <button key={row.key} type="button" className="ui-button ui-button--secondary" onClick={() => selectIcon(row)} style={{ display: 'grid', gridTemplateColumns: 'minmax(8rem,1fr) minmax(6rem,auto)', gap: '.65rem', textAlign: 'left', alignItems: 'center' }}><strong>{row.key}</strong><span>{row.status || 'pending'}</span></button>) : <div className="ui-empty">কোনো matching key পাওয়া যায়নি।</div>}</div>}
      </section>

      {selected && <section className="ui-state"><div className="section-heading" style={{ marginBottom: '.8rem' }}><div><p className="section-kicker">Selected Key</p><h2>{selected.key}</h2></div></div>
        {selected.icon_url && <div style={{ display: 'flex', alignItems: 'center', gap: '.8rem', marginBottom: '.8rem' }}><img src={selected.icon_url} alt="" style={{ width: 56, height: 56, objectFit: 'contain' }} /><span style={{ color: 'var(--color-muted)' }}>বর্তমান আইকন</span></div>}
        <form onSubmit={handleUpload} style={{ display: 'grid', gap: '.8rem' }}>
          <label style={{ display: 'grid', gap: '.4rem' }}><span>Key Name</span><input className="ui-input" value={selected.key} readOnly /></label>
          <label style={{ display: 'grid', gap: '.4rem' }}><span>Icon Upload</span><input type="file" accept="image/svg+xml,image/png,image/webp" onChange={(e) => setFile(e.target.files?.[0] || null)} required /></label>
          {file && <small>{file.name}</small>}
          {error && <div className="ui-state" role="alert">{error.message || 'আইকন আপলোড করা যায়নি।'}</div>}
          {notice && <div className="ui-state" role="status">{notice}</div>}
          <div style={{ display: 'flex', gap: '.55rem', flexWrap: 'wrap' }}><button type="submit" className="ui-button" disabled={saving || !file}>{saving ? 'আপলোড হচ্ছে…' : 'আইকন আপলোড'}</button><button type="button" className="ui-button ui-button--secondary" onClick={() => { setSelected(null); setQuery(''); setFile(null) }} disabled={saving}>বন্ধ</button></div>
        </form>
      </section>}
    </div>
  </AdminLayout>
}
