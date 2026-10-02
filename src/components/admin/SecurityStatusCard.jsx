import { useEffect, useState } from 'react'
import { hasPermission } from '../../services/permissionService'
import { getSecurityTestStatus, runSecurityTest } from '../../services/securityTestService'
import { runWebsiteScan } from '../../services/websiteScanService'
import { Button, Loading } from '../ui'

const STATUS = {
  passed: { label: 'নিরাপদ', symbol: '✓' },
  warning: { label: 'সতর্কতা', symbol: '!' },
  failed: { label: 'সমস্যা পাওয়া গেছে', symbol: '×' },
  unknown: { label: 'চেক করা হয়নি', symbol: '?' },
}

function formatTime(value) {
  if (!value) return 'এখনও চালানো হয়নি'
  try { return new Date(value).toLocaleString('bn-BD', { dateStyle: 'medium', timeStyle: 'short' }) } catch { return value }
}

function mergeResults(security, website) {
  const checks = [...(security?.checks || []), ...(website?.checks || [])]
  const summary = checks.reduce((acc, check) => {
    acc[check.status] = (acc[check.status] || 0) + 1
    return acc
  }, { passed: 0, warning: 0, failed: 0 })
  return {
    status: summary.failed ? 'failed' : summary.warning ? 'warning' : 'passed',
    summary,
    checks,
    completed_at: website?.completed_at || security?.completed_at,
    scannedRoutes: website?.scannedRoutes || [],
    durationMs: website?.durationMs || 0,
  }
}

export default function SecurityStatusCard() {
  const [allowed, setAllowed] = useState(false)
  const [lastSecurity, setLastSecurity] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true
    hasPermission('settings_manage').then(async (permission) => {
      if (!active) return
      setAllowed(permission)
      if (!permission) { setLoading(false); return }
      try {
        const latest = await getSecurityTestStatus()
        if (!active) return
        setLastSecurity(latest)
        setResult(latest)
      } catch (requestError) {
        if (active) setError(requestError)
      } finally {
        if (active) setLoading(false)
      }
    }).catch((requestError) => {
      if (!active) return
      setError(requestError)
      setLoading(false)
    })
    return () => { active = false }
  }, [])

  async function runFullScan() {
    setError(null)
    setRunning(true)
    try {
      const [security, website] = await Promise.all([runSecurityTest(), runWebsiteScan()])
      setLastSecurity(security)
      setResult(mergeResults(security, website))
    } catch (requestError) {
      setError(requestError)
    } finally {
      setRunning(false)
    }
  }

  if (!allowed && !loading) return null
  if (loading) return <section className="ui-state" aria-label="ওয়েবসাইট নিরাপত্তা পরীক্ষা"><Loading /></section>

  const meta = STATUS[result?.status] || STATUS.unknown
  const summary = result?.summary || {}
  const checks = Array.isArray(result?.checks) ? result.checks : []
  const routes = Array.isArray(result?.scannedRoutes) ? result.scannedRoutes : []

  return (
    <section className="ui-state" aria-labelledby="security-status-title" style={{ display: 'grid', gap: '.85rem' }}>
      <div className="section-heading" style={{ marginBottom: 0 }}>
        <div>
          <p className="section-kicker">ওয়েবসাইট হেলথ ও সিকিউরিটি স্ক্যানার</p>
          <h2 id="security-status-title">পুরো ওয়েবসাইট পরীক্ষা</h2>
          <p className="admin-meta">সর্বশেষ রিপোর্ট: {formatTime(result?.completed_at)}</p>
        </div>
        <Button type="button" onClick={runFullScan} disabled={running}>
          {running ? 'পুরো ওয়েবসাইট স্ক্যান হচ্ছে…' : 'পুরো ওয়েবসাইট স্ক্যান করুন'}
        </Button>
      </div>

      <p style={{ margin: 0 }}>বাটনে চাপ দিলে public page, links, images, forms, accessibility, HTTPS/mixed-content এবং Supabase security controls একসাথে পরীক্ষা হবে।</p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.6rem', alignItems: 'center' }}>
        <strong style={{ fontSize: '1.05rem' }}>{meta.symbol} {meta.label}</strong>
        <span>Passed: {summary.passed ?? 0}</span>
        <span>Warning: {summary.warning ?? 0}</span>
        <span>Failed: {summary.failed ?? 0}</span>
        {routes.length ? <span>Pages scanned: {routes.length}</span> : null}
      </div>

      {lastSecurity?.completed_at && !result?.scannedRoutes?.length ? <p className="admin-meta">শেষ DB security test: {formatTime(lastSecurity.completed_at)}</p> : null}
      {error ? <p role="alert" className="admin-error">{error.message || 'ওয়েবসাইট স্ক্যান চালানো যায়নি।'}</p> : null}

      {checks.length ? (
        <div style={{ display: 'grid', gap: '.4rem', maxHeight: '32rem', overflow: 'auto' }}>
          {checks.map((check, index) => (
            <div key={check.key + '-' + index} style={{ display: 'grid', gridTemplateColumns: '1.2rem minmax(0, 1fr)', gap: '.5rem', padding: '.45rem .55rem', borderRadius: '.5rem', background: 'var(--color-surface, rgba(127,127,127,.08))' }}>
              <strong aria-hidden="true">{check.status === 'passed' ? '✓' : check.status === 'warning' ? '!' : '×'}</strong>
              <div>
                <strong>{check.label}</strong>
                <div style={{ color: 'var(--color-muted)', fontSize: '.86rem' }}>{check.detail}</div>
                {check.category ? <small style={{ color: 'var(--color-muted)' }}>{check.category}</small> : null}
              </div>
            </div>
          ))}
        </div>
      ) : <p className="admin-meta">স্ক্যান শুরু করতে উপরের বাটনে চাপ দিন।</p>}
    </section>
  )
}
