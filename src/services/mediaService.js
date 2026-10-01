import { supabase } from '../lib/supabase'

const MEDIA_BUCKET = 'media'

export async function listVisibleMedia({ albumId } = {}) {
  if (!supabase) throw new Error('Supabase is not configured')
  let query = supabase.from('media').select('*').eq('is_visible', true).order('created_at', { ascending: false })
  if (albumId) query = query.eq('album_id', albumId)
  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export async function listManagedMedia() {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase.from('media').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export function getMediaPublicUrl(storagePath, mediaUrl = null) {
  if (storagePath && supabase) return supabase.storage.from(MEDIA_BUCKET).getPublicUrl(storagePath).data.publicUrl
  return mediaUrl || null
}

export async function uploadMediaObject(path, file, options = {}) {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase.storage.from(MEDIA_BUCKET).upload(path, file, options)
  if (error) throw error
  return data
}

export async function deleteMediaObjects(paths) {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase.storage.from(MEDIA_BUCKET).remove(paths)
  if (error) throw error
  return data ?? []
}

async function currentUserId() {
  const { data, error } = await supabase.auth.getUser()
  if (error) throw error
  if (!data.user) throw new Error('Authentication required')
  return data.user.id
}

export async function createMediaRecord({ file, albumId = null, isVisible = true }) {
  const userId = await currentUserId()
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, '-')
  const storagePath = userId + '/' + crypto.randomUUID() + '-' + safeName
  await uploadMediaObject(storagePath, file, { contentType: file.type, upsert: false })
  try {
    const { data, error } = await supabase.from('media').insert({
      media_key: crypto.randomUUID(),
      media_type: file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : file.type.startsWith('audio/') ? 'audio' : 'file',
      file_name: file.name,
      mime_type: file.type || null,
      file_size: file.size,
      storage_path: storagePath,
      media_url: null,
      album_id: albumId || null,
      is_visible: isVisible,
      created_by: userId,
    }).select('*').single()
    if (error) throw error
    return data
  } catch (error) {
    await deleteMediaObjects([storagePath]).catch(() => {})
    throw error
  }
}

export async function deleteMediaRecord(media) {
  if (media.storage_path) await deleteMediaObjects([media.storage_path])
  const { error } = await supabase.from('media').delete().eq('media_id', media.media_id)
  if (error) throw error
}

function externalMimeType(mediaType) {
  if (mediaType === 'video') return 'video/external'
  if (mediaType === 'audio') return 'audio/external'
  if (mediaType === 'document') return 'application/pdf'
  return 'image/external'
}

export async function createExternalMediaRecord({ url, mediaType = 'image', fileName = '', albumId = null, isVisible = true }) {
  const userId = await currentUserId()
  const normalizedUrl = String(url || '').trim()
  if (!normalizedUrl) throw new Error('Media URL is required')
  const { data, error } = await supabase.from('media').insert({
    media_key: crypto.randomUUID(),
    media_type: mediaType,
    file_name: fileName || normalizedUrl.split('/').pop()?.split('?')[0] || 'external-media',
    mime_type: externalMimeType(mediaType),
    file_size: null,
    storage_path: null,
    media_url: normalizedUrl,
    album_id: albumId || null,
    is_visible: isVisible,
    created_by: userId,
  }).select('*').single()
  if (error) throw error
  return data
}

export async function updateMediaRecord(mediaId, values) {
  const mediaUrl = String(values.media_url || '').trim() || null
  const mediaType = values.media_type || 'image'
  const payload = {
    media_url: mediaUrl,
    album_id: values.album_id || null,
    is_visible: values.is_visible !== false,
    file_name: values.file_name || null,
    media_type: mediaType,
  }
  if (mediaUrl) payload.mime_type = externalMimeType(mediaType)
  const { data, error } = await supabase.from('media').update(payload).eq('media_id', mediaId).select('*').single()
  if (error) throw error
  return data
}
