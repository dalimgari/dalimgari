import { supabase } from '../lib/supabase'
import { MEDIA_POLICY, isAllowedMediaType } from '../config/mediaPolicy'


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
  if (storagePath && supabase) return supabase.storage.from(MEDIA_POLICY.bucket).getPublicUrl(storagePath).data.publicUrl
  return mediaUrl || null
}

export async function uploadMediaObject(path, file, options = {}) {
  if (!supabase) throw new Error('Supabase is not configured')
  if (!file || !(file instanceof File)) throw new Error('Valid media file is required')
  if (file.size <= 0 || file.size > MEDIA_POLICY.maxSizeBytes) throw new Error('Media file must be between 1 byte and 50 MB')
  if (!isAllowedMediaType(file.type)) throw new Error('This file type is not allowed')
  if (!path || path.length > MEDIA_POLICY.storagePath.maxLength || path.includes('..')) throw new Error('Invalid storage path')
  const { data, error } = await supabase.storage.from(MEDIA_POLICY.bucket).upload(path, file, {
    ...options,
    contentType: file.type,
    upsert: false,
  })
  if (error) throw error
  return data
}

export async function deleteMediaObjects(paths) {
  if (!supabase) throw new Error('Supabase is not configured')
  const safePaths = (paths || []).filter((path) => typeof path === 'string' && path.length > 0 && path.length <= MEDIA_POLICY.storagePath.maxLength && !path.includes('..'))
  if (!safePaths.length) return []
  const { data, error } = await supabase.storage.from(MEDIA_BUCKET).remove(safePaths)
  if (error) throw error
  return data ?? []
}

async function currentUserId() {
  const { data, error } = await supabase.auth.getUser()
  if (error) throw error
  if (!data.user) throw new Error('Authentication required')
  return data.user.id
}

function normalizeExternalUrl(url) {
  const value = String(url || '').trim()
  if (!value || value.length > 2048) throw new Error('A valid media URL is required')
  let parsed
  try { parsed = new URL(value) } catch { throw new Error('Invalid media URL') }
  if (parsed.protocol !== 'https:') throw new Error('Only HTTPS media URLs are allowed')
  if (parsed.username || parsed.password) throw new Error('Credential-bearing URLs are not allowed')
  if (!parsed.hostname || parsed.hostname.length > 253) throw new Error('Invalid media hostname')
  return parsed.toString()
}

function safeFileName(value, fallback = 'external-media') {
  const name = String(value || '').replace(/[\\/\0\r\n]+/g, '-').replace(/[^a-zA-Z0-9._-]+/g, '-').slice(0, 180)
  return name || fallback
}

export async function createMediaRecord({ file, albumId = null, isVisible = true }) {
  const userId = await currentUserId()
  if (!file || !(file instanceof File)) throw new Error('Valid media file is required')
  const safeName = safeFileName(file.name)
  const storagePath = userId + '/' + crypto.randomUUID() + '-' + safeName
  await uploadMediaObject(storagePath, file)
  try {
    const { data, error } = await supabase.from('media').insert({
      media_key: crypto.randomUUID(),
      media_type: file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : file.type.startsWith('audio/') ? 'audio' : 'file',
      file_name: safeName,
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
  if (!['image', 'video', 'audio', 'document'].includes(mediaType)) throw new Error('Invalid media type')
  if (mediaType === 'video') return 'video/external'
  if (mediaType === 'audio') return 'audio/external'
  if (mediaType === 'document') return 'application/pdf'
  return 'image/external'
}

export async function createExternalMediaRecord({ url, mediaType = 'image', fileName = '', albumId = null, isVisible = true }) {
  const userId = await currentUserId()
  const normalizedUrl = normalizeExternalUrl(url)
  const { data, error } = await supabase.from('media').insert({
    media_key: crypto.randomUUID(),
    media_type: mediaType,
    file_name: safeFileName(fileName || normalizedUrl.split('/').pop()?.split('?')[0]),
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
  const mediaUrl = String(values.media_url || '').trim() ? normalizeExternalUrl(values.media_url) : null
  const mediaType = values.media_type || 'image'
  externalMimeType(mediaType)
  const payload = {
    media_url: mediaUrl,
    album_id: values.album_id || null,
    is_visible: values.is_visible !== false,
    file_name: safeFileName(values.file_name),
    media_type: mediaType,
  }
  if (mediaUrl) payload.mime_type = externalMimeType(mediaType)
  const { data, error } = await supabase.from('media').update(payload).eq('media_id', mediaId).select('*').single()
  if (error) throw error
  return data
}
