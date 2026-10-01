import { supabase } from '../lib/supabase'

export async function listPublishedPages() {
  if (!supabase) throw new Error('Supabase is not configured')

  const { data, error } = await supabase
    .from('pages')
    .select('*')
    .eq('status', 'published')
    .eq('is_visible', true)
    .order('page_title', { ascending: true })

  if (error) throw error
  return data ?? []
}
