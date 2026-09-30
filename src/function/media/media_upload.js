import { supabase_client } from '../../service/supabase/supabase_client.js'

export async function upload_media(file, path) {
  if (!file) throw new Error('media_file_required')

  const { data, error } = await supabase_client.storage
    .from('global_media')
    .upload(path, file, { contentType: file.type, upsert: false })

  if (error) throw error

  const { data: public_data } = supabase_client.storage
    .from('global_media')
    .getPublicUrl(data.path)

  return { path: data.path, url: public_data.publicUrl }
}

export async function select_media() {
  const { data, error } = await supabase_client
    .from('media')
    .select('media_id, media_key, media_url, media_method, album_id, file_name, mime_type')
    .eq('is_visible', true)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

export function resolve_media_url(url) {
  return url?.trim() || null
}
