import { supabase } from '../lib/supabase'

const iconCache = new Map()

export async function getIconsByKeys(keys = []) {
  if (!supabase || !Array.isArray(keys) || keys.length === 0) return {}
  const uniqueKeys = [...new Set(keys.filter(Boolean))]
  const missingKeys = uniqueKeys.filter((key) => !iconCache.has(key))

  if (missingKeys.length) {
    const { data, error } = await supabase
      .from('icon_management')
      .select('key, icon_url, icon_name, status')
      .in('key', missingKeys)
      .eq('status', 'downloaded')

    if (error) throw error
    ;(data ?? []).forEach((item) => iconCache.set(item.key, item))
  }

  return Object.fromEntries(uniqueKeys.map((key) => [key, iconCache.get(key) ?? null]))
}

export async function getIconByKey(key) {
  const icons = await getIconsByKeys([key])
  return icons[key] ?? null
}

export function clearIconCache() {
  iconCache.clear()
}
