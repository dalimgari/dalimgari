import { supabase } from '../lib/supabase'

export const DEFAULT_HOMEPAGE_CONFIG = {
  hero: { enabled: true, title: '', subtitle: '', showSlogan: true },
  topicTabs: { enabled: true, items: [
    { label: 'গ্রামের তথ্য', href: '/information', enabled: true },
    { label: 'প্রকৃতি', href: '', enabled: true },
    { label: 'গ্রামবাসী', href: '', enabled: true },
    { label: 'ইতিহাস', href: '', enabled: true },
    { label: 'ঐতিহ্য', href: '', enabled: true },
    { label: 'ছবি ও ভিডিও', href: '#media-gallery', enabled: true },
  ]},
  information: { enabled: true },
  posts: { enabled: true, limit: 6, title: 'গ্রামের খবর' },
  mediaGallery: { enabled: true, title: 'গ্যালারি', subtitle: 'ছবি ও ভিডিও', showAll: true, albumIds: [] },
  albums: { enabled: true, limit: 4, title: 'অ্যালবাম' },
  sidebar: { enabled: true, items: [], cards: [] },
}

function mergeConfig(config) {
  return {
    ...DEFAULT_HOMEPAGE_CONFIG,
    ...config,
    hero: { ...DEFAULT_HOMEPAGE_CONFIG.hero, ...(config?.hero || {}) },
    topicTabs: { ...DEFAULT_HOMEPAGE_CONFIG.topicTabs, ...(config?.topicTabs || {}) },
    information: { ...DEFAULT_HOMEPAGE_CONFIG.information, ...(config?.information || {}) },
    posts: { ...DEFAULT_HOMEPAGE_CONFIG.posts, ...(config?.posts || {}) },
    mediaGallery: { ...DEFAULT_HOMEPAGE_CONFIG.mediaGallery, ...(config?.mediaGallery || {}) },
    albums: { ...DEFAULT_HOMEPAGE_CONFIG.albums, ...(config?.albums || {}) },
    sidebar: { ...DEFAULT_HOMEPAGE_CONFIG.sidebar, ...(config?.sidebar || {}) },
  }
}

export async function getHomepageSettings() {
  if (!supabase) return DEFAULT_HOMEPAGE_CONFIG
  const { data, error } = await supabase.from('homepage_settings').select('config').limit(1).maybeSingle()
  if (error) throw error
  return mergeConfig(data?.config || {})
}

export async function saveHomepageSettings(config) {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError) throw userError
  if (!userData.user) throw new Error('Authentication required')
  const payload = { config: mergeConfig(config), updated_by: userData.user.id, updated_at: new Date().toISOString() }
  const { data: existing, error: readError } = await supabase.from('homepage_settings').select('settings_id').limit(1).maybeSingle()
  if (readError) throw readError
  const query = existing
    ? supabase.from('homepage_settings').update(payload).eq('settings_id', existing.settings_id)
    : supabase.from('homepage_settings').insert(payload)
  const { data, error } = await query.select('config').single()
  if (error) throw error
  return mergeConfig(data.config)
}
