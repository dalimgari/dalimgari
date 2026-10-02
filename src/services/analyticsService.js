import { supabase } from '../lib/supabase'

const SESSION_KEY = 'dalimgari_analytics_session'
const TRACKED_PREFIX = 'dalimgari_analytics_tracked:'

function getSessionId() {
  try {
    const saved = sessionStorage.getItem(SESSION_KEY)
    if (saved) return saved
    const next = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`
    sessionStorage.setItem(SESSION_KEY, next)
    return next
  } catch {
    return null
  }
}

function getTrackedKey(path) { return `${TRACKED_PREFIX}${path}` }

export async function trackPageView({ path, deviceClass, language, theme }) {
  if (!supabase || !path) return
  const key = getTrackedKey(path)
  try {
    const last = Number(sessionStorage.getItem(key) || 0)
    if (Date.now() - last < 30 * 60 * 1000) return
    sessionStorage.setItem(key, String(Date.now()))
  } catch {}

  const { error } = await supabase.rpc('record_analytics_visit', {
    p_path: path,
    p_referrer: document.referrer || null,
    p_user_agent: navigator.userAgent || null,
    p_session_id: getSessionId(),
    p_device_class: deviceClass || null,
    p_language: language || null,
    p_theme: theme || null,
  })
  if (error) { try { sessionStorage.removeItem(key) } catch {} }
}

export async function getAnalyticsSummary(days = 30) {
  if (!supabase) throw new Error('Supabase is not configured')
  const since = new Date(Date.now() - Math.max(1, days) * 86400000).toISOString()
  const { data, error } = await supabase
    .from('analytics_visits')
    .select('path,session_id,device_class,language,theme,created_at')
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(5000)
  if (error) throw error
  const rows = data ?? []
  const byPath = new Map()
  rows.forEach((row) => byPath.set(row.path, (byPath.get(row.path) || 0) + 1))
  return {
    total: rows.length,
    uniqueSessions: new Set(rows.map((row) => row.session_id).filter(Boolean)).size,
    byPath: [...byPath.entries()].sort((a, b) => b[1] - a[1]),
    rows,
  }
}