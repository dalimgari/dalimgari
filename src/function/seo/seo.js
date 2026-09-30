import { supabase } from '../../service/supabase/supabase_client.js'

export async function get_seo_settings(entity_type, entity_id = null) {
  let query = supabase
    .from('seo_settings')
    .select('*')
    .eq('entity_type', entity_type)
    .eq('is_active', true)

  if (entity_id) query = query.eq('entity_id', entity_id)

  const { data, error } = await query.maybeSingle()
  if (error) throw error
  return data
}

export function build_seo_url(base_url, slug) {
  const base = base_url?.replace(/\/$/, '') ?? ''
  const path = slug?.replace(/^\//, '') ?? ''
  return path ? `${base}/${path}` : base
}
