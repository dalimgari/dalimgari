import { supabase } from '../../service/supabase/supabase_client.js'

export async function record_visitor_visit(visit) {
  const visited_at = visit.visited_at ?? new Date().toISOString()
  const retention_expires_at = new Date(Date.parse(visited_at) + 30 * 24 * 60 * 60 * 1000).toISOString()

  const { data, error } = await supabase
    .from('analytics_visits')
    .insert({ ...visit, visited_at, retention_expires_at })
    .select('analytics_visit_id')
    .single()

  if (error) throw error
  return data
}

export async function get_analytics_visits() {
  const { data, error } = await supabase
    .from('analytics_visits')
    .select('*')
    .order('visited_at', { ascending: false })

  if (error) throw error
  return data ?? []
}
