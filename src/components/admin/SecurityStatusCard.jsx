import { useEffect, useState } from 'react'
import { hasPermission } from '../../services/permissionService'
import { getSecurityTestStatus, runSecurityTest } from '../../services/securityTestService'
import { Button, Loading } from '../ui'

const STATUS = {
  passed: { label: 'নিরাপদ', symbol: '✓' },
  warning: { label: 'সতর্কতা', symbol: '!' },
  failed: { label: 'ঝুঁকি পাওয়া গেছে', symbol: '×' },
  unknown: { label: 'চেক করা হয়নি', symbol: '?' },
  forbidden: { label: 'অনুমতি নেই', symbol: '—' },
}

function formatTime(value) {
  if (!value) return 'এখনও চালানো হয়নি'
  try { return new Date(value).toLocaleString('bn-BD', { dateStyle: 'medium', timeStyle: 'short' }) } catch { return value }
}

export default function SecurityStatusCard() {
  const [allowed, setAllowed] = useState(false)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState(null)

  async function refresh(run = false) {
    setError(null)
    if (run) setRunning(true)
    try {
      const next = run ? await runSecurityTest() : await getSecurityTestStatus()
      setResult(next)
    } catch (requestError) {
      setError(requestError)
    } finally {
      setLoading(false)
      setRunning(false)
    }
  }

  useEffect(() => {
    let active = true
    hasPermission('settings_manage').then((permission) => {
      if (!active) return
      setAllowed(permission)
      if (!permission) { setLoading(false); return }
      return refresh(true)
    }).catch((requestError) => {
      if (!active) return
      setError(requestError)
      setLoading(false)
    })
    return () => { active = false }
  }, [])

  if (!allowed && !loading) return null
  if (loading) return <section className="ui-state" aria-label="নিরাপত্তা পরীক্ষা"><Loading /></section>

  const meta = STATUS[result?.status] || STATUS.unknown
  const summary = result?.summary || {}
  const checks = Array.isArray(result?.checks) ? result.checks : []

  return (
    <section className="ui-state" aria-labelledby="security-status-title" style={{ display: 'grid', gap: '.85rem' }}>
      <div className="section-heading" style={{ marginBottom: 0 }}>
        <div>
          <p className="section-kicker">অটো সিকিউরিটি মনিটর</p>
          <h2 id="security-status-title">সিস্টেম নিরাপত্তার অবস্থা</h2>
          <p className="admin-meta">সর্বশেষ পরীক্ষা: {formatTime(result?.completed_at)}</p>
        </div>
        <Button type="button" onClick={() => refresh(true)} disabled={running}>
          {running ? 'পরীক্ষা চলছে…' : 'এখনই পরীক্ষা করুন'}
        </Button>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.6rem', alignItems: 'center' }}>
        <strong style={{ fontSize: '1.05rem' }}>{meta.symbol} {meta.label}</strong>
        <span>Passed: {summary.passed ?? 0}</span>
        <span>Warning: {summary.warning ?? 0}</span>
        <span>Failed: {summary.failed ?? 0}</span>
      </div>

      {error ? <p role="alert" className="admin-error">{error.message || 'নিরাপত্তা পরীক্ষা চালানো যায়নি।'}</p> : null}

      {checks.length ? (
        <div style={{ display: 'grid', gap: '.4rem' }}>
          {checks.map((check) => (
            <div key={check.key} style={{ display: 'grid', gridTemplateColumns: '1.2rem minmax(0, 1fr)', gap: '.5rem', padding: '.45rem .55rem', borderRadius: '.5rem', background: 'var(--color-surface, rgba(127,127,127,.08))' }}>
              <strong aria-hidden="true">{check.status === 'passed' ? '✓' : check.status === 'warning' ? '!' : '×'}</strong>
              <div>
                <strong>{check.label}</strong>
                <div style={{ color: 'var(--color-muted)', fontSize: '.86rem' }}>{check.detail}</div>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  )
}
