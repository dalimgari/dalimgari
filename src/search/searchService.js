import { supabase } from '../lib/supabase'

export async function searchPublicContent(term, { limit = 30 } = {}) {
  if (!supabase) throw new Error('Supabase is not configured')
  const query = String(term || '').trim()
  if (!query) return []
  const safeLimit = Math.min(Math.max(Number(limit) || 30, 1), 30)
  const pattern = '%' + query.replace(/[%_\\]/g, '\\$&') + '%'
  const [pages, posts] = await Promise.all([
    supabase.from('pages').select('page_id,page_title,page_slug,content').eq('status','published').eq('is_visible',true).or('page_title.ilike.' + pattern + ',content.ilike.' + pattern).limit(safeLimit),
    supabase.from('posts').select('post_id,title,description').eq('status','published').eq('is_visible',true).or('title.ilike.' + pattern + ',description.ilike.' + pattern).limit(safeLimit),
  ])
  if (pages.error) throw pages.error
  if (posts.error) throw posts.error
  return [
    ...(pages.data ?? []).map(item=>({type:'page',id:item.page_id,title:item.page_title,description:item.content,href:'/pages/'+item.page_slug})),
    ...(posts.data ?? []).map(item=>({type:'post',id:item.post_id,title:item.title,description:item.description,href:'/posts/'+item.post_id})),
  ].slice(0,safeLimit)
}
