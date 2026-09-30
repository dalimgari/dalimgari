import { supabase } from '../../service/supabase/supabase_client'

export async function get_media_library({ album_id = null } = {}) {
  let query = supabase.from('media').select('*, albums(*)').order('created_at', { ascending: false })
  if (album_id) query = query.eq('album_id', album_id)
  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export async function get_media_albums() {
  const { data, error } = await supabase.from('albums').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function update_media(media_id, media_data) {
  const { data, error } = await supabase.from('media').update(media_data).eq('media_id', media_id).select().single()
  if (error) throw error
  return data
}

export async function delete_media(media_id) {
  const { data: media, error: read_error } = await supabase.from('media').select('storage_path').eq('media_id', media_id).maybeSingle()
  if (read_error) throw read_error
  if (media?.storage_path) await supabase.storage.from('global-media').remove([media.storage_path])
  const { error } = await supabase.from('media').delete().eq('media_id', media_id)
  if (error) throw error
}
