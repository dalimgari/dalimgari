import { supabase } from '../lib/supabase'

export async function listPublishedPosts({ limit = 30 } = {}) {
  if (!supabase) throw new Error('Supabase is not configured')

  const safeLimit = Math.min(Math.max(Number(limit) || 30, 1), 30)

  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('status', 'published')
    .eq('is_visible', true)
    .order('published_at', { ascending: false })
    .limit(safeLimit)

  if (error) throw error
  return data ?? []
}
