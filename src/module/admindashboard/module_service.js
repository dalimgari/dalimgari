import { supabase } from '../../service/supabase/supabase_client'

export async function save_website_information(information_key, information_value) {
  return supabase.from('website_information').upsert({ information_key, information_value, is_active: true }, { onConflict: 'information_key' })
}

export async function save_admin_information(profile_id, information_value, social_links, other_links) {
  return supabase.from('admin_information').upsert({ profile_id, information_value, social_links, other_links }, { onConflict: 'profile_id' })
}

export async function create_page(page) { return supabase.from('pages').insert(page).select().single() }
export async function update_page(page_id, page) { return supabase.from('pages').update(page).eq('page_id', page_id).select().single() }
export async function delete_page(page_id) { return supabase.from('pages').delete().eq('page_id', page_id) }
export async function create_post(post) { return supabase.from('posts').insert(post).select().single() }
export async function update_post(post_id, post) { return supabase.from('posts').update(post).eq('post_id', post_id).select().single() }
export async function delete_post(post_id) { return supabase.from('posts').delete().eq('post_id', post_id) }
export async function get_users() { return supabase.from('profiles').select('*').order('created_at', { ascending: false }) }
export async function get_analysis_info() { return supabase.from('analytics_visits').select('*').order('visited_at', { ascending: false }) }
export async function save_customization(setting_key, setting_value, updated_by) { return supabase.from('customization_settings').upsert({ setting_key, setting_value, updated_by, is_active: true }, { onConflict: 'setting_key' }) }
export async function save_system_setting(setting_key, setting_value, updated_by) { return supabase.from('system_settings').upsert({ setting_key, setting_value, updated_by, is_active: true }, { onConflict: 'setting_key' }) }
