import { supabase } from '../lib/supabase'

let defaultAvatarPromise = null

function toDataUrl(svg) {
  if (!svg) return ''
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

export async function getDefaultProfileAvatarUrl() {
  if (!supabase) throw new Error('Supabase is not configured')
  if (!defaultAvatarPromise) {
    defaultAvatarPromise = supabase
      .from('profile_avatar_settings')
      .select('avatar_svg')
      .eq('id', 'default')
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) throw error
        return toDataUrl(data?.avatar_svg)
      })
      .catch((error) => {
        defaultAvatarPromise = null
        throw error
      })
  }
  return defaultAvatarPromise
}

export async function getProfileAvatarUrl(profile) {
  const customUrl = typeof profile?.profile_image_url === 'string' ? profile.profile_image_url.trim() : ''
  if (customUrl) return customUrl
  return getDefaultProfileAvatarUrl()
}
