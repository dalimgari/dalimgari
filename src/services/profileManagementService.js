import { supabase } from '../lib/supabase'

export async function getProfileForManagement(profileId) {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase.from('profiles').select('*').eq('profile_id', profileId).single()
  if (error) throw error
  return data
}

export async function updateProfileForManagement(profileId, values) {
  if (!supabase) throw new Error('Supabase is not configured')
  const payload = {
    email: values.email ?? null,
    phone: values.phone ?? null,
    display_name: values.display_name ?? null,
    bio: values.bio ?? null,
    link: values.link ?? null,
    profile_image_url: values.profile_image_url ?? null,
    is_active: values.is_active !== false,
    is_protected: values.is_protected === true,
  }
  const { data, error } = await supabase.from('profiles').update(payload).eq('profile_id', profileId).select('*').single()
  if (error) throw error
  return data
}
