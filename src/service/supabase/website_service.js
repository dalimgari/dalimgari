import { supabase } from './supabase_client'

export async function get_website_information() {
  const { data, error } = await supabase.from('website_information').select('*').eq('is_active', true)
  if (error) throw error
  return data ?? []
}

export async function get_admin_information() {
  const { data, error } = await supabase.from('admin_information').select('*, profiles(*)').limit(1).maybeSingle()
  if (error) throw error
  return data
}

export async function get_public_pages() {
  const { data, error } = await supabase.from('pages').select('*').eq('is_visible', true).eq('status', 'published').order('display_order', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function get_public_posts() {
  const { data, error } = await supabase.from('posts').select('*, albums(*), post_media(*, media(*))').eq('is_visible', true).eq('status', 'published').order('published_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function get_public_customization() {
  const { data, error } = await supabase.from('customization_settings').select('*').eq('is_active', true)
  if (error) throw error
  return data ?? []
}
