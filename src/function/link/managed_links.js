import { supabase } from '../../service/supabase/supabase_client.js'

export async function get_managed_links() {
  const { data, error } = await supabase
    .from('managed_links')
    .select('link_id,link_key,title,url,icon_domain,domain,display_order,is_active')
    .eq('is_active', true)
    .order('display_order', { ascending: true })

  if (error) throw error
  return data ?? []
}

export async function get_managed_link(link_key) {
  const key = String(link_key ?? '').trim()
  if (!key) return null

  const { data, error } = await supabase
    .from('managed_links')
    .select('link_id,link_key,title,url,icon_domain,domain,display_order,is_active')
    .eq('link_key', key)
    .eq('is_active', true)
    .maybeSingle()

  if (error) throw error
  return data ?? null
}

export async function get_managed_link_icon(link_key) {
  const link = await get_managed_link(link_key)
  if (!link) return null

  const { data, error } = await supabase
    .from('domain_icons')
    .select('icon_url')
    .eq('domain', link.icon_domain)
    .maybeSingle()

  if (error) throw error
  return data?.icon_url ?? null
}

export function link_href(link) {
  return link?.url ?? ''
}

export function link_icon(link, icon_url = null) {
  return icon_url ?? link?.icon_url ?? null
}
