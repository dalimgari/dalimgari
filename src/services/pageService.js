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

export async function listManagedPages() {
  if (!supabase) throw new Error('Supabase is not configured')

  const { data, error } = await supabase
    .from('pages')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function createPage(values) {
  if (!supabase) throw new Error('Supabase is not configured')

  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError) throw userError
  if (!userData.user) throw new Error('Authentication required')

  const payload = {
    page_key: values.page_key,
    page_title: values.page_title,
    page_slug: values.page_slug,
    content: values.content ?? '',
    status: values.status ?? 'draft',
    is_visible: values.is_visible !== false,
    created_by: userData.user.id,
    updated_by: userData.user.id,
  }

  const { data, error } = await supabase.from('pages').insert(payload).select('*').single()
  if (error) throw error
  return data
}

export async function updatePage(pageId, values) {
  if (!supabase) throw new Error('Supabase is not configured')

  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError) throw userError
  if (!userData.user) throw new Error('Authentication required')

  const payload = {
    page_key: values.page_key,
    page_title: values.page_title,
    page_slug: values.page_slug,
    content: values.content ?? '',
    status: values.status ?? 'draft',
    is_visible: values.is_visible !== false,
    updated_by: userData.user.id,
  }

  const { data, error } = await supabase
    .from('pages')
    .update(payload)
    .eq('page_id', pageId)
    .select('*')
    .single()

  if (error) throw error
  return data
}

export async function deletePage(pageId) {
  if (!supabase) throw new Error('Supabase is not configured')

  const { error } = await supabase.from('pages').delete().eq('page_id', pageId)
  if (error) throw error
}
