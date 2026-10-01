import { supabase } from '../lib/supabase'

export async function listPublishedPosts({ limit = 30 } = {}) {
  if (!supabase) throw new Error('Supabase is not configured')
  const safeLimit = Math.min(Math.max(Number(limit) || 30, 1), 30)
  const { data, error } = await supabase.from('posts').select('*').eq('status', 'published').eq('is_visible', true).order('published_at', { ascending: false }).limit(safeLimit)
  if (error) throw error
  return data ?? []
}

export async function getPublishedPostById(postId) {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data: post, error } = await supabase.from('posts').select('*').eq('post_id', postId).eq('status', 'published').eq('is_visible', true).maybeSingle()
  if (error) throw error
  if (!post) return null
  const { data: links, error: linkError } = await supabase.from('post_media').select('display_order, media(*)').eq('post_id', postId).order('display_order', { ascending: true })
  if (linkError) throw linkError
  return { ...post, media: (links ?? []).map((item) => item.media).filter((media) => media && media.is_visible !== false) }
}

export async function listManagedPosts() {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase.from('posts').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function listPostMedia(postId) {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase.from('post_media').select('post_media_id, media_id, display_order, media(*)').eq('post_id', postId).order('display_order', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function replacePostMedia(postId, mediaIds) {
  if (!supabase) throw new Error('Supabase is not configured')
  const ids = [...new Set((mediaIds ?? []).filter(Boolean))]
  const { error: deleteError } = await supabase.from('post_media').delete().eq('post_id', postId)
  if (deleteError) throw deleteError
  if (!ids.length) return []
  const rows = ids.map((mediaId, index) => ({ post_id: postId, media_id: mediaId, display_order: index }))
  const { data, error } = await supabase.from('post_media').insert(rows).select('post_media_id, media_id, display_order, media(*)')
  if (error) throw error
  return data ?? []
}

async function currentUserId() {
  const { data, error } = await supabase.auth.getUser()
  if (error) throw error
  if (!data.user) throw new Error('Authentication required')
  return data.user.id
}

export async function createPost(values) {
  const userId = await currentUserId()
  const publishedAt = values.status === 'published' ? new Date().toISOString() : null
  const { data, error } = await supabase.from('posts').insert({
    post_key: values.post_key, title: values.title, description: values.description ?? null,
    album_id: values.album_id || null, status: values.status ?? 'draft', is_visible: values.is_visible !== false,
    created_by: userId, updated_by: userId, published_at: publishedAt,
  }).select('*').single()
  if (error) throw error
  return data
}

export async function updatePost(postId, values) {
  const userId = await currentUserId()
  const { data: current } = await supabase.from('posts').select('published_at,status').eq('post_id',postId).maybeSingle()
  const publishedAt = values.status === 'published' ? (current?.published_at || new Date().toISOString()) : null
  const { data, error } = await supabase.from('posts').update({
    post_key: values.post_key, title: values.title, description: values.description ?? null,
    album_id: values.album_id || null, status: values.status ?? 'draft', is_visible: values.is_visible !== false,
    updated_by: userId, published_at: publishedAt,
  }).eq('post_id', postId).select('*').single()
  if (error) throw error
  return data
}

export async function deletePost(postId) {
  const { error } = await supabase.from('posts').delete().eq('post_id', postId)
  if (error) throw error
}
