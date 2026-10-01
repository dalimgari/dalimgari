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

export async function updateWebsiteInformation(values) {
  if (!supabase) throw new Error('Supabase is not configured')

  const information = await getWebsiteInformation()
  if (!information?.website_information_id) {
    throw new Error('Website information record is missing')
  }

  const payload = {
    village_name: values.village_name ?? null,
    slogan: values.slogan ?? null,
    division: values.division ?? null,
    district: values.district ?? null,
    upazila_name: values.upazila_name ?? null,
    union_name: values.union_name ?? null,
    postal_code: values.postal_code ?? null,
    population: values.population === '' || values.population === null || values.population === undefined
      ? null
      : Number(values.population),
    established_date: values.established_date || null,
    map_location: values.map_location ?? null,
    copyright_text: values.copyright_text || null,
  }

  const { data, error } = await supabase
    .from('website_information')
    .update(payload)
    .eq('website_information_id', information.website_information_id)
    .select('*')
    .single()

  if (error) throw error
  return data
}
