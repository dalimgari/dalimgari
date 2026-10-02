import { supabase } from '../lib/supabase'

function client() { if (!supabase) throw new Error('Supabase is not configured'); return supabase }

export async function getAdminInformation(profileId) {
  const { data, error } = await client().from('admin_information').select('*').eq('profile_id', profileId).maybeSingle()
  if (error) throw error
  return data
}

export async function updateAdminInformation(profileId, values) {
  const payload = { profile_id: profileId, name: values.name ?? null, email: values.email ?? null, phone: values.phone ?? null, bio: values.bio ?? null, link: values.link ?? null, profile_image_url: values.profile_image_url ?? null }
  const existing = await getAdminInformation(profileId)
  if (!existing) {
    const { data, error } = await client().from('admin_information').insert(payload).select('*').single()
    if (error) throw error
    return data
  }
  const { data, error } = await client().from('admin_information').update(payload).eq('admin_information_id', existing.admin_information_id).select('*').single()
  if (error) throw error
  return data
}
