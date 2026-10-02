import { useEffect, useState } from 'react'
import { getCurrentProfile } from '../../services/profileService'
import { getProfileAvatarUrl, getDefaultProfileAvatarUrl } from '../../services/profileAvatarService'

export default function ProfileAvatar({ user, profile = null, className = 'site-header__profile-avatar', alt = 'Profile' }) {
  const [avatarUrl, setAvatarUrl] = useState('')
  const [fallbackUrl, setFallbackUrl] = useState('')

  useEffect(() => {
    let active = true
    async function load() {
      if (!user) {
        if (active) { setAvatarUrl(''); setFallbackUrl('') }
        return
      }
      try {
        const [resolvedProfile, fallback] = await Promise.all([
          profile ? Promise.resolve(profile) : getCurrentProfile(),
          getDefaultProfileAvatarUrl(),
        ])
        if (!active) return
        setFallbackUrl(fallback)
        setAvatarUrl(await getProfileAvatarUrl(resolvedProfile))
      } catch {
        if (!active) return
        setFallbackUrl('')
        setAvatarUrl('')
      }
    }
    load()
    return () => { active = false }
  }, [user?.id, profile?.profile_image_url])

  if (!user) return null
  if (!avatarUrl && !fallbackUrl) return null
  return <img className={className} src={avatarUrl || fallbackUrl} alt={alt} referrerPolicy="no-referrer" onError={() => setAvatarUrl(fallbackUrl)} />
}
