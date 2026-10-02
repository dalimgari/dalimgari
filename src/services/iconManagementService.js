import { supabase } from '../lib/supabase'

const iconCache = new Map()

export async function listIconManagement() {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase.from('icon_management').select('*').order('key', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function uploadIconForKey(key, file) {
  if (!supabase) throw new Error('Supabase is not configured')
  if (!key || !file) throw new Error('Key and icon file are required')
  const allowed = ['image/svg+xml', 'image/png', 'image/webp']
  if (!allowed.includes(file.type)) throw new Error('শুধু SVG, PNG বা WebP icon আপলোড করা যাবে।')
  if (file.size > 1024 * 1024) throw new Error('Icon file সর্বোচ্চ 1 MB হতে পারবে।')
  const extension = file.type === 'image/svg+xml' ? 'svg' : file.type === 'image/webp' ? 'webp' : 'png'
  const storagePath = `${key}.${extension}`
  const { error: uploadError } = await supabase.storage.from('site-icons').upload(storagePath, file, { upsert: true, contentType: file.type, cacheControl: '3600' })
  if (uploadError) throw uploadError
  const { data: publicData } = supabase.storage.from('site-icons').getPublicUrl(storagePath)
  const iconUrl = publicData.publicUrl
  const { data, error } = await supabase.from('icon_management').upsert({ key, icon_url: iconUrl, storage_path: storagePath, status: 'downloaded', source: 'manual_upload', file_type: file.type, file_size: file.size }, { onConflict: 'key' }).select('*').single()
  if (error) throw error
  iconCache.delete(key)
  return data
}

export async function getIconsByKeys(keys = []) {
  if (!supabase || !Array.isArray(keys) || keys.length === 0) return {}
  const uniqueKeys = [...new Set(keys.filter(Boolean))]
  const missingKeys = uniqueKeys.filter((key) => !iconCache.has(key))
  if (missingKeys.length) {
    const { data, error } = await supabase.from('icon_management').select('key, icon_url, icon_name, status').in('key', missingKeys).eq('status', 'downloaded')
    if (error) throw error
    ;(data ?? []).forEach((item) => iconCache.set(item.key, item))
  }
  return Object.fromEntries(uniqueKeys.map((key) => [key, iconCache.get(key) ?? null]))
}

export async function getIconByKey(key) {
  const icons = await getIconsByKeys([key])
  return icons[key] ?? null
}

export function clearIconCache() { iconCache.clear() }
