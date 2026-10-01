import { supabase } from '../lib/supabase'

const MEDIA_BUCKET = 'media'

export async function listVisibleMedia({ albumId } = {}) {
  if (!supabase) throw new Error('Supabase is not configured')

  let query = supabase
    .from('media')
    .select('*')
    .eq('is_visible', true)
    .order('created_at', { ascending: false })

  if (albumId) query = query.eq('album_id', albumId)

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export function getMediaPublicUrl(storagePath) {
  if (!supabase || !storagePath) return null
  return supabase.storage.from(MEDIA_BUCKET).getPublicUrl(storagePath).data.publicUrl
}

export async function uploadMediaObject(path, file, options = {}) {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase.storage.from(MEDIA_BUCKET).upload(path, file, options)
  if (error) throw error
  return data
}

export async function updateMediaObject(path, file, options = {}) {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase.storage.from(MEDIA_BUCKET).update(path, file, options)
  if (error) throw error
  return data
}

export async function deleteMediaObjects(paths) {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase.storage.from(MEDIA_BUCKET).remove(paths)
  if (error) throw error
  return data ?? []
}
