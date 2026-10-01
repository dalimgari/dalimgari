import { supabase } from '../lib/supabase'

export async function listVisibleAlbums() {
  if (!supabase) throw new Error('Supabase is not configured')

  const { data, error } = await supabase
    .from('albums')
    .select('*')
    .eq('is_visible', true)
    .order('title', { ascending: true })

  if (error) throw error
  return data ?? []
}
