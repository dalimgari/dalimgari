import { supabase } from '../../service/supabase/supabase_client'

const bucket_name = 'global_media'

export async function upload_media(file, metadata = {}) {
  const extension = file.name.split('.').pop()?.toLowerCase() || 'bin'
  const media_key = crypto.randomUUID()
  const storage_path = `${new Date().getUTCFullYear()}/${media_key}.${extension}`
  const { error: upload_error } = await supabase.storage.from(bucket_name).upload(storage_path, file, { upsert: false })
  if (upload_error) throw upload_error
  const { data: public_data } = supabase.storage.from(bucket_name).getPublicUrl(storage_path)
  const { data, error } = await supabase.from('media').insert({ media_key, media_url: public_data.publicUrl, storage_path, original_name: file.name, mime_type: file.type, file_size: file.size, metadata }).select().single()
  if (error) throw error
  return data
}

export async function get_media_library({ album_id = null } = {}) {
  let query = supabase.from('media').select('*').order('created_at', { ascending: false })
  if (album_id) query = query.eq('album_id', album_id)
  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export async function get_media_url(media_id) {
  const { data, error } = await supabase.from('media').select('media_url').eq('media_id', media_id).maybeSingle()
  if (error) throw error
  return data?.media_url ?? null
}

export async function save_external_media(media_url, metadata = {}) {
  const { data, error } = await supabase.from('media').insert({ media_key: crypto.randomUUID(), media_url, source_type: 'external_url', metadata }).select().single()
  if (error) throw error
  return data
}
