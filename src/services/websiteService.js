import { supabase } from '../lib/supabase'

export async function getWebsiteInformation() {
  if (!supabase) throw new Error('Supabase is not configured')

  const { data, error } = await supabase
    .from('website_information')
    .select('*')
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data
}
