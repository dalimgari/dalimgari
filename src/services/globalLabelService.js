import { supabase } from '../lib/supabase'

const cache = new Map()

export async function getGlobalLabels() {
  if (!supabase) return {}
  const { data, error } = await supabase.from('global_ui_labels').select('key,eng,bng')
  if (error) throw error
  const labels = {}
  for (const row of data || []) {
    labels[row.key] = { eng: row.eng, bng: row.bng || row.eng }
    cache.set(row.key, labels[row.key])
  }
  return labels
}

export function label(key, language = 'bng', fallback = key) {
  const item = cache.get(key)
  if (!item) return fallback
  return language === 'eng' ? item.eng || fallback : item.bng || item.eng || fallback
}

export async function ensureGlobalLabel(key, eng) {
  if (!supabase || !key || !eng) return null
  const { data, error } = await supabase.rpc('ensure_global_ui_label', { p_key: key, p_eng: eng })
  if (error) throw error
  const row = Array.isArray(data) ? data[0] : data
  if (row) cache.set(key, { eng: row.eng, bng: row.bng || row.eng })
  return row
}

export async function updateGlobalLabel(key, eng, bng) {
  if (!supabase) throw new Error('Supabase is not configured')
  const english = String(eng ?? '').trim()
  const bangla = String(bng ?? '').trim() || null
  if (!english) throw new Error('English label is required')
  const { data, error } = await supabase.from('global_ui_labels').update({ eng: english, bng: bangla }).eq('key', key).select('key,eng,bng').single()
  if (error) throw error
  cache.set(key, { eng: data.eng, bng: data.bng || data.eng })
  return data
}

export function clearGlobalLabelCache() { cache.clear() }
