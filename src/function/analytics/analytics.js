import { supabase_client } from '../../service/supabase/supabase_client.js'

export async function record_visitor_visit(visit) {
  const visited_at = visit.visited_at ?? new Date().toISOString()
  const retention_expires_at = new Date(Date.parse(visited_at) + 30 * 24 * 60 * 60 * 1000).toISOString()

  const { data, error } = await supabase_client
    .from('analytics_visits')
    .insert({ ...visit, visited_at, retention_expires_at })
    .select('analytics_visit_id')
    .single()

  if (error) throw error
  return data
}

export async function get_analytics_visits() {
  const { data, error } = await supabase_client
    .from('analytics_visits')
    .select('*')
    .order('visited_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

export function build_visitor_payload({ page_path, referrer } = {}) {
  return {
    visitor_key: get_visitor_key(),
    page_path: page_path ?? window.location.pathname,
    referrer: referrer ?? (document.referrer || null),
    device_type: /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
    browser_name: navigator.userAgent,
    operating_system: navigator.platform,
    language_code: navigator.language,
    screen_width: window.screen.width,
    screen_height: window.screen.height,
    user_agent: navigator.userAgent
  }
}

function get_visitor_key() {
  const storage_key = 'website_visitor_key'
  const existing_key = localStorage.getItem(storage_key)
  if (existing_key) return existing_key
  const new_key = crypto.randomUUID()
  localStorage.setItem(storage_key, new_key)
  return new_key
}
