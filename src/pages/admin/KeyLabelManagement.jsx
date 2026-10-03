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
  const fields = [normalize(row.key), normalize(row.bng)]
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
  const [label, setLabel] = useState('')
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
    setLabel(row.bng || '')
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

    const nextLabel = normalize(label)
    if (!nextLabel) {
      setError(new Error('লেবেল খালি রাখা যাবে না।'))
      return
    }

    if (nextLabel === normalize(selected.bng)) {
      setNotice('কোনো পরিবর্তন করা হয়নি।')
      return
    }

    setSaving(true)
    setError(null)
    setNotice('')
    try {
      const updated = await updateGlobalLabel(selected.key, nextLabel)
      setLabels((current) => current.map((item) => item.key === updated.key ? updated : item))
      setSelected(updated)
      setLabel(updated.bng || '')
      setNotice('লেবেল সংরক্ষণ হয়েছে।')
      await createAuditLog({
        actionKey: 'global_label_updated',
        module: 'global_ui_labels',
        details: { key: updated.key, label: updated.bng },
      }).catch(() => null)
    } catch (saveError) {
      setError(saveError)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <AdminLayout user={user} title="লেবেল ব্যবস্থাপনা"><Loading /></AdminLayout>
  if (error && !labels.length) {
    return <AdminLayout user={user} title="লেবেল ব্যবস্থাপনা"><ErrorState description={error.message || 'লেবেল তথ্য লোড করা যায়নি।'} /></AdminLayout>
  }

  return (
    <AdminLayout user={user} title="Key Label Management">
      <div className="admin-management" style={{ display: 'grid', gap: '1rem' }}>
        <section className="ui-state">
          <div className="section-heading" style={{ marginBottom: '.8rem' }}>
            <div>
              <p className="section-kicker">লেবেল ব্যবস্থাপনা</p>
              <h1>কী লেবেল</h1>
              <p style={{ margin: '.35rem 0 0', color: 'var(--color-muted)' }}>
                কী বা সংরক্ষিত লেবেল দিয়ে খুঁজুন। একটি কী-এর জন্য একটি লেবেলই রাখা হয়।
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
              placeholder="কী / লেবেল"
              autoComplete="off"
              aria-controls="key-label-suggestions"
              aria-autocomplete="list"
            />
          </label>

          {normalize(query) && !selected && (
            <div id="key-label-suggestions" role="listbox" aria-label="মিল পাওয়া লেবেল" style={{ display: 'grid', gap: '.45rem', marginTop: '.65rem' }}>
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
                  <span>{row.bng || 'লেবেল মিসিং'}</span>
                </button>
              )) : (
                <div className="ui-empty">কোনো মিল পাওয়া কী পাওয়া যায়নি।</div>
              )}
            </div>
          )}
        </section>

        {selected && (
          <section className="ui-state">
            <div className="section-heading" style={{ marginBottom: '.8rem' }}>
              <div>
                <p className="section-kicker">নির্বাচিত কী</p>
                <h2>{selected.key}</h2>
              </div>
            </div>

            <form onSubmit={handleSave} style={{ display: 'grid', gap: '.8rem' }}>
              <label style={{ display: 'grid', gap: '.4rem' }}>
                <span>কী</span>
                <input className="ui-input" value={selected.key} readOnly aria-readonly="true" />
              </label>

              <label style={{ display: 'grid', gap: '.4rem' }}>
                <span>লেবেল</span>
                <input className="ui-input" value={label} onChange={(event) => setLabel(event.target.value)} required />
              </label>

              {error && <div className="ui-state" role="alert">{error.message || 'লেবেল সংরক্ষণ করা যায়নি।'}</div>}
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
