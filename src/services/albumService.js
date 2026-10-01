import { supabase } from '../lib/supabase'

export async function listVisibleAlbums() {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase.from('albums').select('*').eq('is_visible', true).order('title', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function listManagedAlbums() {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase.from('albums').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

async function currentUserId() {
  const { data, error } = await supabase.auth.getUser()
  if (error) throw error
  if (!data.user) throw new Error('Authentication required')
  return data.user.id
}

export async function createAlbum(values) {
  const userId = await currentUserId()
  const { data, error } = await supabase.from('albums').insert({ album_key: values.album_key, title: values.title, description: values.description || null, is_visible: values.is_visible !== false, created_by: userId }).select('*').single()
  if (error) throw error
  return data
}

export async function updateAlbum(albumId, values) {
  const { data, error } = await supabase.from('albums').update({ album_key: values.album_key, title: values.title, description: values.description || null, is_visible: values.is_visible !== false }).eq('album_id', albumId).select('*').single()
  if (error) throw error
  return data
}

export async function deleteAlbum(albumId) {
  const { error } = await supabase.from('albums').delete().eq('album_id', albumId)
  if (error) throw error
}
