import { supabase } from '../../service/supabase/supabase_client'

const bucket_name = 'global_media'

function public_url(storage_path) {
  return supabase.storage.from(bucket_name).getPublicUrl(storage_path).data.publicUrl
}

export async function upload_media(file) {
  if (!file) throw new Error('media_file_required')
  const extension = file.name.split('.').pop()?.toLowerCase() || 'bin'
  const media_key = crypto.randomUUID()
  const storage_path = `${new Date().getUTCFullYear()}/${media_key}.${extension}`
  const { error: upload_error } = await supabase.storage
    .from(bucket_name)
    .upload(storage_path, file, { contentType: file.type || undefined, upsert: false })
  if (upload_error) throw upload_error

  const media_url = public_url(storage_path)
  const { data, error } = await supabase.from('media').insert({
    media_key,
    media_method: 'upload',
    file_name: file.name,
    mime_type: file.type || null,
    file_size: file.size,
    storage_path,
    media_url,
    is_visible: true
  }).select().single()

  if (error) {
    await supabase.storage.from(bucket_name).remove([storage_path])
    throw error
  }
  return data
}

export async function save_external_media(media_url) {
  const normalized_url = String(media_url ?? '').trim()
  if (!/^https?:\/\//i.test(normalized_url)) throw new Error('invalid_media_url')
  const { data, error } = await supabase.from('media').insert({
    media_key: crypto.randomUUID(),
    media_method: 'url',
    media_url: normalized_url,
    is_visible: true
  }).select().single()
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
