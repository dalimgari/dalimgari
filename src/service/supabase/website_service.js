import { supabase } from './supabase_client'

async function read_public_table(table_name, build_query) {
  try {
    let query = supabase.from(table_name).select('*')
    if (build_query) query = build_query(query)
    const { data, error } = await query
    if (error) throw error
    return data ?? []
  } catch (error) {
    console.error(`Failed to load ${table_name}`, error)
    return []
  }
}

export async function get_website_information() {
  return read_public_table('website_information', (query) => query.select('website_information_id,information_key,information_value,is_active').eq('is_active', true))
}

export async function get_public_links() {
  return read_public_table('managed_links', (query) =>
    query.select('link_id,link_key,title,domain,url,icon_domain,display_order,is_active').eq('is_active', true).order('display_order', { ascending: true })
  )
}

export async function get_admin_information() {
  try {
    const { data, error } = await supabase.from('admin_information').select('information_value,updated_at').limit(1).maybeSingle()
    if (error) throw error
    return data ?? null
  } catch (error) {
    console.error('Failed to load admin information', error)
    return null
  }
}

export async function get_public_pages() {
  return read_public_table('pages', (query) =>
    query.select('page_id,page_key,page_title,page_slug,html_content,seo_data,display_order,is_visible,status').eq('is_visible', true).eq('status', 'published').order('display_order', { ascending: true })
  )
}

export async function get_public_posts() {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('post_id,post_key,caption,album_id,status,is_visible,seo_data,published_at,post_media(post_media_id,media_id,display_order,media(media_id,media_key,media_method,file_name,mime_type,file_size,storage_path,media_url,album_id,is_visible))')
      .eq('is_visible', true)
      .eq('status', 'published')
      .order('published_at', { ascending: false })

    if (error) throw error

    return (data ?? []).map((post) => ({
      ...post,
      post_media: (post.post_media ?? [])
        .filter((item) => item.media?.is_visible !== false)
        .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
    }))
  } catch (error) {
    console.error('Failed to load posts', error)
    return []
  }
}

export async function get_public_customization() {
  return read_public_table('customization_settings', (query) => query.select('customization_setting_id,setting_key,setting_value,is_active').eq('is_active', true))
}

export async function get_public_seo_settings() {
  const rows = await read_public_table('seo_settings', (query) => query.select('seo_setting_id,entity_type,entity_id,seo_title,seo_description,seo_slug,canonical_url,robots_directive,is_active').eq('is_active', true))
  return rows.map((row) => ({
    ...row,
    title: row.seo_title ?? {},
    description: row.seo_description ?? {},
    canonical_url: row.canonical_url ?? null,
    robots: row.robots_directive ?? null
  }))
}
