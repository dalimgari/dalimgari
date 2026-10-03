import { supabase } from '../lib/supabase'
import { flattenUiSsot, UI_SSOT } from '../config/uiSSOT'

const cache = new Map()
export const GLOBAL_LABEL_DEFAULTS = Object.fromEntries(
  Object.entries(flattenUiSsot(UI_SSOT)).map(([key, value]) => [key, value?.bng || ''])
)
const MISSING_LABEL = 'Label Missing'

export async function getGlobalLabels() {
  if (!supabase) return {}
  await Promise.all(Object.entries(GLOBAL_LABEL_DEFAULTS).map(([key, labelValue]) => ensureGlobalLabel(key, labelValue).catch(() => null)))
  const { data, error } = await supabase.from('global_ui_labels').select('key,bng')
  if (error) throw error
  const labels = {}
  for (const row of data || []) {
    labels[row.key] = { bng: row.bng || null }
    cache.set(row.key, labels[row.key])
  }
  return labels
}

export async function listGlobalLabels() {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase.from('global_ui_labels').select('key,bng').order('key', { ascending: true })
  if (error) throw error
  return data || []
}

export function label(key, fallback = MISSING_LABEL) {
  const item = cache.get(key)
  return item?.bng || fallback
}

export async function ensureGlobalLabel(key, labelValue) {
  if (!supabase || !key || !labelValue) return null
  const { data, error } = await supabase.rpc('ensure_global_ui_label', { p_key: key, p_label: labelValue })
  if (error) throw error
  const row = Array.isArray(data) ? data[0] : data
  if (row) cache.set(key, { bng: row.bng || null })
  return row
}

export async function updateGlobalLabel(key, labelValue) {
  if (!supabase) throw new Error('Supabase is not configured')
  const canonical = String(labelValue ?? '').trim()
  if (!canonical) throw new Error(MISSING_LABEL)
  const { data, error } = await supabase
    .from('global_ui_labels')
    .update({ bng: canonical })
    .eq('key', key)
    .select('key,bng')
    .single()
  if (error) throw error
  cache.set(key, { bng: data.bng || null })
  return data
}

export function clearGlobalLabelCache() {
  cache.clear()
}
