import { supabase } from '../lib/supabase'

const cache = new Map()
let loaded = false
let loadingPromise = null

function normalize(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim()
}

function cacheRows(rows) {
  cache.clear()
  for (const row of rows || []) {
    const source = normalize(row.source_text)
    const english = normalize(row.english_text)
    if (source && english) cache.set(source, english)
  }
  loaded = true
  return getTranslationOverrides()
}

export function getTranslationOverrides() {
  return new Map(cache)
}

export async function loadTranslationOverrides() {
  if (!supabase) return getTranslationOverrides()
  if (loaded) return getTranslationOverrides()
  if (loadingPromise) return loadingPromise

  loadingPromise = supabase
    .from('translation_overrides')
    .select('source_text,english_text')
    .order('source_text', { ascending: true })
    .then(({ data, error }) => {
      if (error) throw error
      return cacheRows(data || [])
    })
    .finally(() => {
      loadingPromise = null
    })

  return loadingPromise
}

export async function listTranslationOverrides() {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase
    .from('translation_overrides')
    .select('source_text,english_text,created_at,updated_at')
    .order('source_text', { ascending: true })
  if (error) throw error
  cacheRows(data || [])
  return data || []
}

export async function saveTranslationOverride(sourceText, englishText) {
  if (!supabase) throw new Error('Supabase is not configured')
  const source = normalize(sourceText)
  const english = normalize(englishText)
  if (!source || !english) throw new Error('বাংলা source এবং English translation দুটিই দিতে হবে।')

  const { data, error } = await supabase
    .from('translation_overrides')
    .upsert(
      { source_text: source, english_text: english, updated_at: new Date().toISOString() },
      { onConflict: 'source_text' },
    )
    .select('source_text,english_text,created_at,updated_at')
    .single()
  if (error) throw error

  cache.set(source, english)
  loaded = true
  return data
}

export async function deleteTranslationOverride(sourceText) {
  if (!supabase) throw new Error('Supabase is not configured')
  const source = normalize(sourceText)
  const { error } = await supabase.from('translation_overrides').delete().eq('source_text', source)
  if (error) throw error
  cache.delete(source)
  return source
}

export function clearTranslationOverrideCache() {
  cache.clear()
  loaded = false
  loadingPromise = null
}