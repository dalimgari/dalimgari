import { supabase } from '../lib/supabase'

export const DEFAULT_SIDEBAR_CONFIG = { enabled: true, items: [] }

function mergeConfig(config) {
  return { ...DEFAULT_SIDEBAR_CONFIG, ...(config || {}), items: Array.isArray(config?.items) ? config.items : [] }
}

export async function getSidebarSettings() {
  if (!supabase) return DEFAULT_SIDEBAR_CONFIG
  const { data, error } = await supabase.from('sidebar_settings').select('config').limit(1).maybeSingle()
  if (error) throw error
  return mergeConfig(data?.config)
}

export async function saveSidebarSettings(config) {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError) throw userError
  if (!userData.user) throw new Error('Authentication required')
  const payload = { config: mergeConfig(config), updated_by: userData.user.id, updated_at: new Date().toISOString() }
  const { data: existing, error: readError } = await supabase.from('sidebar_settings').select('settings_id').limit(1).maybeSingle()
  if (readError) throw readError
  const query = existing ? supabase.from('sidebar_settings').update(payload).eq('settings_id', existing.settings_id) : supabase.from('sidebar_settings').insert(payload)
  const { data, error } = await query.select('config').single()
  if (error) throw error
  return mergeConfig(data.config)
}