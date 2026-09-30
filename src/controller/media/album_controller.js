import { supabase } from '../../service/supabase/supabase_client'

export async function create_album(album_data) {
  const { data, error } = await supabase.from('albums').insert(album_data).select().single()
  if (error) throw error
  return data
}

export async function update_album(album_id, album_data) {
  const { data, error } = await supabase.from('albums').update(album_data).eq('album_id', album_id).select().single()
  if (error) throw error
  return data
}

export async function delete_album(album_id) {
  const { error } = await supabase.from('albums').delete().eq('album_id', album_id)
  if (error) throw error
}
