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
  return read_public_table('website_information', (query) => query.eq('is_active', true))
}

export async function get_public_links() {
  return read_public_table('managed_links', (query) =>
    query.eq('is_active', true).order('display_order', { ascending: true })
  )
}

export async function get_admin_information() {
  try {
    const [{ data, error }, { data: managed_links, error: links_error }] = await Promise.all([
      supabase.from('admin_information').select('*').limit(1).maybeSingle(),
      supabase.from('managed_links').select('*').eq('is_active', true).order('display_order', { ascending: true })
    ])

    if (error) throw error
    if (links_error) throw links_error
    return data ? { ...data, managed_links: managed_links ?? [] } : null
  } catch (error) {
    console.error('Failed to load admin information', error)
    return null
  }
}

export async function get_public_pages() {
  return read_public_table('pages', (query) =>
    query.eq('is_visible', true).eq('status', 'published').order('display_order', { ascending: true })
  )
}

export async function get_public_posts() {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('*, post_media(post_media_id, media_id, display_order, media(*))')
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
  return read_public_table('customization_settings', (query) => query.eq('is_active', true))
}

export async function get_public_seo_settings() {
  const rows = await read_public_table('seo_settings', (query) => query.eq('is_active', true))
  return rows.map((row) => ({
    ...row,
    title: row.seo_title ?? {},
    description: row.seo_description ?? {},
    canonical_url: row.canonical_url ?? null,
    robots: row.robots_directive ?? null
  }))
}
