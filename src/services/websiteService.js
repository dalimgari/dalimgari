import { supabase } from '../lib/supabase'

const DEFAULT_COPYRIGHT = '© 2026. All rights reserved.'

export async function getWebsiteInformation() {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase.from('website_information').select('*').limit(1).maybeSingle()
  if (error) throw error
  return data
}

export async function updateWebsiteInformation(values) {
  if (!supabase) throw new Error('Supabase is not configured')
  const information = await getWebsiteInformation()
  const payload = {
    village_name: values.village_name ?? null,
    slogan: values.slogan ?? null,
    division: values.division ?? null,
    district: values.district ?? null,
    upazila_name: values.upazila_name ?? null,
    union_name: values.union_name ?? null,
    postal_code: values.postal_code ?? null,
    population: values.population === '' || values.population === null || values.population === undefined ? null : Number(values.population),
    established_date: values.established_date || null,
    map_location: values.map_location ?? null,
    copyright_text: String(values.copyright_text ?? '').trim() || DEFAULT_COPYRIGHT,
  }
  if (!information?.website_information_id) {
    const { data, error } = await supabase.from('website_information').insert(payload).select('*').single()
    if (error) throw error
    return data
  }
  const { data, error } = await supabase.from('website_information').update(payload).eq('website_information_id', information.website_information_id).select('*').single()
  if (error) throw error
  return data
}

export async function getRuralVisualSettings() {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase.from('rural_visual_settings').select('*').eq('is_active', true).order('updated_at', { ascending: false }).limit(1).maybeSingle()
  if (error) throw error
  return data
}

export async function updateRuralVisualSettings(values) {
  if (!supabase) throw new Error('Supabase is not configured')
  const current = await supabase.from('rural_visual_settings').select('visual_settings_id').eq('settings_key', 'global').maybeSingle()
  if (current.error) throw current.error
  const payload = {
    settings_key: 'global',
    wallpaper_url: values.wallpaper_url ?? null,
    wallpaper_mobile_url: values.wallpaper_mobile_url ?? null,
    wallpaper_overlay: values.wallpaper_overlay ?? 'natural',
    wallpaper_position: values.wallpaper_position ?? 'center center',
    wallpaper_size: values.wallpaper_size ?? 'cover',
    icon_set: values.icon_set ?? {},
    text_styles: values.text_styles ?? {},
    component_styles: values.component_styles ?? {},
    custom_css: values.custom_css ?? {},
    is_active: values.is_active !== false,
  }
  if (!current.data?.visual_settings_id) {
    const { data, error } = await supabase.from('rural_visual_settings').insert(payload).select('*').single()
    if (error) throw error
    return data
  }
  const { data, error } = await supabase.from('rural_visual_settings').update(payload).eq('visual_settings_id', current.data.visual_settings_id).select('*').single()
  if (error) throw error
  return data
}
