import { supabase } from '../../service/supabase/supabase_client.js'

export async function get_translation_settings() {
  const { data, error } = await supabase
    .from('translation_settings')
    .select('setting_key, source_language, supported_languages, is_active')
    .eq('is_active', true)

  if (error) throw error
  return data ?? []
}

export function get_localized_value(value, language = 'bn') {
  if (!value || typeof value !== 'object') return value ?? ''
  return value[language] ?? value.bn ?? value.en ?? ''
}
