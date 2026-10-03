import { useEffect, useMemo, useState } from 'react'
import { AdminLayout } from '../../components/admin'
import { Button, ErrorState, Loading } from '../../components/ui'
import { SearchSuggestions } from '../../components/global components'
import { createAuditLog } from '../../services/auditService'
import { deleteTranslationOverride, listTranslationOverrides, saveTranslationOverride } from '../../services/translationOverrideService'
import { useAuth } from '../../context'

const MAX_SUGGESTIONS = 12

function normalize(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim()
}

function rankMatch(item, query) {
  const needle = normalize(query).toLocaleLowerCase()
  const fields = [normalize(item.source_text), normalize(item.english_text)].map((field) => field.toLocaleLowerCase())
  if (fields.some((field) => field === needle)) return 0
  if (fields.some((field) => field.startsWith(needle))) return 1
  if (fields.some((field) => field.includes(needle))) return 2
  return 99
}

export default function TranslationOverrideManagement() {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [query, setQuery] = useState('')
  const [source, setSource] = useState('')
  const [english, setEnglish] = useState('')
  const [editing, setEditing] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    let active = true
    listTranslationOverrides()
      .then((data) => { if (active) setItems(data) })
      .catch((requestError) => { if (active) setError(requestError) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const filtered = useMemo(() => {
    const needle = normalize(query).toLocaleLowerCase()
    if (!needle) return items
    return items.filter((item) =>
      [item.source_text, item.english_text].some((value) => normalize(value).toLocaleLowerCase().includes(needle))
    )
  }, [items, query])

  const suggestions = useMemo(() => {
    const needle = normalize(query)
    if (!needle) return []
    return items
      .map((item) => ({ ...item, rank: rankMatch(item, needle) }))
      .filter((item) => item.rank < 99)
      .sort((a, b) => a.rank - b.rank || a.source_text.localeCompare(b.source_text))
      .slice(0, MAX_SUGGESTIONS)
  }, [items, query])

  function startNewSearch(value) {
    setQuery(value)
    setEditing(null)
    setSource('')
    setEnglish('')
    setNotice('')
    setError(null)
  }

  function selectSuggestion(item) {
    editItem(item)
  }

  function resetForm() {
    setEditing(null)
    setSource('')
    setEnglish('')
    setNotice('')
    setError(null)
  }

  function editItem(item) {
    setEditing(item.source_text)
    setSource(item.source_text)
    setEnglish(item.english_text)
    setNotice('')
    setError(null)
  }

  async function handleSave(event) {
    event.preventDefault()
    const nextSource = normalize(source)
    const nextEnglish = normalize(english)
    if (!nextSource || !nextEnglish) {
      setError(new Error('বাংলা source এবং English translation দুটিই দিতে হবে।'))
      return
    }
    setSaving(true)
    setError(null)
    setNotice('')
    try {
      const saved = await saveTranslationOverride(nextSource, nextEnglish)
      setItems((current) => {
        const withoutSource = current.filter((item) => item.source_text !== saved.source_text)
        return [...withoutSource, saved].sort((a, b) => a.source_text.localeCompare(b.source_text))
      })
      setEditing(saved.source_text)
      setSource(saved.source_text)
      setEnglish(saved.english_text)
      setNotice('Translation override সংরক্ষণ হয়েছে।')
      await createAuditLog({
        actionKey: 'translation_override_updated',
        module: 'translation_overrides',
        details: { source_text: saved.source_text, english_text: saved.english_text },
      }).catch(() => null)
    } catch (saveError) {
      setError(saveError)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(item) {
    if (!window.confirm('এই translation override মুছে ফেলবেন?')) return
    setSaving(true)
    setError(null)
    setNotice('')
    try {
      await deleteTranslationOverride(item.source_text)
      setItems((current) => current.filter((entry) => entry.source_text !== item.source_text))
      if (editing === item.source_text) resetForm()
      setNotice('Translation override মুছে ফেলা হয়েছে।')
      await createAuditLog({
        actionKey: 'translation_override_deleted',
        module: 'translation_overrides',
        details: { source_text: item.source_text },
      }).catch(() => null)
    } catch (deleteError) {
      setError(deleteError)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <AdminLayout user={user} title="Translation Override"><Loading /></AdminLayout>
  if (error && !items.length) return <AdminLayout user={user} title="Translation Override"><ErrorState description={error.message || 'Translation override লোড করা যায়নি।'} /></AdminLayout>

  return (
    <AdminLayout user={user} title="Translation Override">
      <div className="admin-management" style={{ display: 'grid', gap: '1rem' }}>
        <section className="ui-state">
          <div className="section-heading" style={{ marginBottom: '.8rem' }}>
            <div>
              <p className="section-kicker">অনুবাদ ব্যবস্থাপনা</p>
              <h1>নির্ধারিত English translation</h1>
              <p style={{ margin: '.35rem 0 0', color: 'var(--color-muted)' }}>
                কোনো বাংলা শব্দ বা বাক্যের নিজের নির্ধারিত English দিলে automatic translation-এর বদলে সেটিই ব্যবহার হবে।
              </p>
            </div>
          </div>

          <div>
            <label htmlFor="translation-override-search" style={{ display: 'grid', gap: '.4rem' }}>
              <span>খোঁজ</span>
              <input id="translation-override-search" className="ui-input" type="search" value={query} onChange={(event) => startNewSearch(event.target.value)} placeholder="বাংলা বা English" autoComplete="off" aria-controls="translation-override-suggestions" aria-autocomplete="list" />
            </label>
            {normalize(query) && (
              <SearchSuggestions
                id="translation-override-suggestions"
                label="মিল পাওয়া translation"
                suggestions={suggestions}
                emptyMessage="কোনো matching translation পাওয়া যায়নি।"
                getKey={(item) => item.source_text}
                onSelect={selectSuggestion}
                renderOption={(item) => <><span>{item.source_text}</span><strong>{item.english_text}</strong></>}
              />
            )}
          </div>
        </section>

        <section className="ui-state">
          <form onSubmit={handleSave} style={{ display: 'grid', gap: '.8rem' }}>
            <label style={{ display: 'grid', gap: '.4rem' }}>
              <span>বাংলা source</span>
              <input className="ui-input" value={source} onChange={(event) => setSource(event.target.value)} placeholder="যেমন: দলিমগাড়ী" required disabled={Boolean(editing) || saving} />
            </label>
            <label style={{ display: 'grid', gap: '.4rem' }}>
              <span>নির্ধারিত English</span>
              <input className="ui-input" value={english} onChange={(event) => setEnglish(event.target.value)} placeholder="যেমন: Dalimgari" required disabled={saving} />
            </label>
            {error ? <div className="ui-state" role="alert">{error.message || 'Translation override সংরক্ষণ করা যায়নি।'}</div> : null}
            {notice ? <div className="ui-state" role="status">{notice}</div> : null}
            <div style={{ display: 'flex', gap: '.55rem', flexWrap: 'wrap' }}>
              <Button type="submit" disabled={saving}>{saving ? 'সংরক্ষণ হচ্ছে…' : editing ? 'আপডেট করুন' : 'সংরক্ষণ করুন'}</Button>
              {editing ? <Button type="button" variant="secondary" onClick={resetForm} disabled={saving}>নতুন mapping</Button> : null}
            </div>
          </form>
        </section>

        <section className="ui-state">
          <div style={{ display: 'grid', gap: '.55rem' }}>
            {filtered.length ? filtered.map((item) => (
              <div key={item.source_text} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr) auto', gap: '.65rem', alignItems: 'center' }}>
                <span>{item.source_text}</span>
                <strong>{item.english_text}</strong>
                <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap' }}>
                  <Button type="button" variant="secondary" onClick={() => editItem(item)} disabled={saving}>সম্পাদনা</Button>
                  <Button type="button" variant="secondary" onClick={() => handleDelete(item)} disabled={saving}>মুছুন</Button>
                </div>
              </div>
            )) : <div className="ui-empty">কোনো translation mapping পাওয়া যায়নি।</div>}
          </div>
        </section>
      </div>
    </AdminLayout>
  )
}