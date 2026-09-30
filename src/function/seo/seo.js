import { supabase_client } from '../../service/supabase/supabase_client.js'

export async function get_seo_settings(entity_type, entity_id = null) {
  let query = supabase_client
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

export function apply_seo({ title, description, canonical_url } = {}) {
  if (title) document.title = title
  set_meta('description', description)
  set_link('canonical', canonical_url)
}

function set_meta(name, content) {
  if (!content) return
  let element = document.head.querySelector(`meta[name="${name}"]`)
  if (!element) {
    element = document.createElement('meta')
    element.name = name
    document.head.appendChild(element)
  }
  element.content = content
}

function set_link(rel, href) {
  if (!href) return
  let element = document.head.querySelector(`link[rel="${rel}"]`)
  if (!element) {
    element = document.createElement('link')
    element.rel = rel
    document.head.appendChild(element)
  }
  element.href = href
}
