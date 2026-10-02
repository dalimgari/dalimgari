import { useEffect, useMemo, useState } from 'react'
import { AdminLayout } from '../../components/admin'
import { ErrorState, Loading } from '../../components/ui'
import { createAuditLog } from '../../services/auditService'
import { listGlobalLabels, updateGlobalLabel } from '../../services/globalLabelService'
import { useAuth } from '../../context'

const MAX_SUGGESTIONS = 12

function normalize(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim()
}

function rankMatch(row, query) {
  const needle = normalize(query).toLocaleLowerCase()
  const fields = [normalize(row.key), normalize(row.eng), normalize(row.bng)]
  const lowered = fields.map((field) => field.toLocaleLowerCase())
  if (lowered.some((field) => field === needle)) return 0
  if (lowered.some((field) => field.startsWith(needle))) return 1
  if (lowered.some((field) => field.includes(needle))) return 2
  return 99
}

export default function KeyLabelManagement() {
  const { user } = useAuth()
  const [labels, setLabels] = useState([])
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(null)
  const [english, setEnglish] = useState('')
  const [bangla, setBangla] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    let active = true
    listGlobalLabels()
      .then((data) => {
        if (active) setLabels(data)
      })
      .catch((requestError) => {
        if (active) setError(requestError)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [])

  const suggestions = useMemo(() => {
    const needle = normalize(query)
    if (!needle) return []
    return labels
      .map((row) => ({ ...row, rank: rankMatch(row, needle) }))
      .filter((row) => row.rank < 99)
      .sort((a, b) => a.rank - b.rank || a.key.localeCompare(b.key))
      .slice(0, MAX_SUGGESTIONS)
  }, [labels, query])

  function selectLabel(row) {
    setSelected(row)
    setEnglish(row.eng || '')
    setBangla(row.bng || '')
    setQuery(row.key)
    setNotice('')
    setError(null)
  }

  function startNewSearch(value) {
    setQuery(value)
    setSelected(null)
    setNotice('')
    setError(null)
  }

  async function handleSave(event) {
    event.preventDefault()
    if (!selected) return

    const nextEnglish = normalize(english)
    const nextBangla = normalize(bangla)
    if (!nextEnglish) {
      setError(new Error('English label is required.'))
      return
    }

    if (nextEnglish === normalize(selected.eng) && nextBangla === normalize(selected.bng)) {
      setNotice('কোনো পরিবর্তন করা হয়নি।')
      return
    }

    setSaving(true)
    setError(null)
    setNotice('')
    try {
      const updated = await updateGlobalLabel(selected.key, nextEnglish, nextBangla)
      setLabels((current) => current.map((item) => item.key === updated.key ? updated : item))
      setSelected(updated)
      setEnglish(updated.eng || '')
      setBangla(updated.bng || '')
      setNotice('লেবেল রাখা হয়েছে।')
      await createAuditLog({
        actionKey: 'global_label_updated',
        module: 'global_ui_labels',
        details: { key: updated.key, english: updated.eng, bangla: updated.bng },
      }).catch(() => null)
    } catch (saveError) {
      setError(saveError)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <AdminLayout user={user} title="Key Label Management"><Loading /></AdminLayout>
  if (error && !labels.length) {
    return <AdminLayout user={user} title="Key Label Management"><ErrorState description={error.message || 'লেবেল তথ্য লোড করা যায়নি।'} /></AdminLayout>
  }

  return (
    <AdminLayout user={user} title="Key Label Management">
      <div className="admin-management" style={{ display: 'grid', gap: '1rem' }}>
        <section className="ui-state">
          <div className="section-heading" style={{ marginBottom: '.8rem' }}>
            <div>
              <p className="section-kicker">Label Management</p>
              <h1>Key Label Rename</h1>
              <p style={{ margin: '.35rem 0 0', color: 'var(--color-muted)' }}>
                Key name, English label বা বাংলা label দিয়ে খুঁজুন। এখানে শুধু Label Management Database-এর তথ্য দেখানো হয়।
              </p>
            </div>
          </div>

          <label htmlFor="key-label-search" style={{ display: 'grid', gap: '.4rem' }}>
            <span>খোঁজ</span>
            <input
              id="key-label-search"
              className="ui-input"
              type="search"
              value={query}
              onChange={(event) => startNewSearch(event.target.value)}
              placeholder="Key name / English label / বাংলা label"
              autoComplete="off"
              aria-controls="key-label-suggestions"
              aria-autocomplete="list"
            />
          </label>

          {normalize(query) && !selected && (
            <div id="key-label-suggestions" role="listbox" aria-label="Matching labels" style={{ display: 'grid', gap: '.45rem', marginTop: '.65rem' }}>
              {suggestions.length ? suggestions.map((row) => (
                <button
                  key={row.key}
                  type="button"
                  role="option"
                  className="ui-button ui-button--secondary"
                  onClick={() => selectLabel(row)}
                  style={{ display: 'grid', gridTemplateColumns: 'minmax(7rem, .9fr) minmax(7rem, 1fr) minmax(7rem, 1fr)', gap: '.65rem', textAlign: 'left', alignItems: 'center' }}
                >
                  <strong>{row.key}</strong>
                  <span>{row.eng}</span>
                  <span>{row.bng || '—'}</span>
                </button>
              )) : (
                <div className="ui-empty">কোনো matching key পাওয়া যায়নি।</div>
              )}
            </div>
          )}
        </section>

        {selected && (
          <section className="ui-state">
            <div className="section-heading" style={{ marginBottom: '.8rem' }}>
              <div>
                <p className="section-kicker">Selected Key</p>
                <h2>{selected.key}</h2>
              </div>
            </div>

            <form onSubmit={handleSave} style={{ display: 'grid', gap: '.8rem' }}>
              <label style={{ display: 'grid', gap: '.4rem' }}>
                <span>Key Name</span>
                <input className="ui-input" value={selected.key} readOnly aria-readonly="true" />
              </label>

              <label style={{ display: 'grid', gap: '.4rem' }}>
                <span>English Label</span>
                <input className="ui-input" value={english} onChange={(event) => setEnglish(event.target.value)} required />
              </label>

              <label style={{ display: 'grid', gap: '.4rem' }}>
                <span>বাংলা Label</span>
                <input className="ui-input" value={bangla} onChange={(event) => setBangla(event.target.value)} />
              </label>

              {error && <div className="ui-state" role="alert">{error.message || 'লেবেল রাখা যায়নি।'}</div>}
              {notice && <div className="ui-state" role="status">{notice}</div>}

              <div style={{ display: 'flex', gap: '.55rem', flexWrap: 'wrap' }}>
                <button type="submit" className="ui-button" disabled={saving}>
                  {saving ? 'রাখা হচ্ছে…' : 'রাখা'}
                </button>
                <button type="button" className="ui-button ui-button--secondary" onClick={() => startNewSearch('')} disabled={saving}>
                  বন্ধ
                </button>
              </div>
            </form>
          </section>
        )}
      </div>
    </AdminLayout>
  )
}
