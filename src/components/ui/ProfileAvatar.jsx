import { useEffect, useState } from 'react'
import { getCurrentProfile } from '../../services/profileService'
import { getCurrentRole } from '../../services/roleService'
import { getProfileAvatarUrl, getDefaultProfileAvatarUrl } from '../../services/profileAvatarService'

export default function ProfileAvatar({ user, profile = null, className = 'site-header__profile-avatar', alt = 'Profile' }) {
  const [avatarUrl, setAvatarUrl] = useState('')
  const [fallbackUrl, setFallbackUrl] = useState('')

  useEffect(() => {
    let active = true
    async function load() {
      try {
        const fallback = await getDefaultProfileAvatarUrl()
        if (!active) return
        setFallbackUrl(fallback)

        if (!user) {
          setAvatarUrl(fallback)
          return
        }

        // Verify the authenticated account and its role before resolving its profile.
        const role = await getCurrentRole()
        if (!role) {
          setAvatarUrl(fallback)
          return
        }

        const resolvedProfile = profile || await getCurrentProfile()
        setAvatarUrl(await getProfileAvatarUrl(resolvedProfile))
      } catch {
        if (!active) return
        setAvatarUrl('')
        setFallbackUrl('')
      }
    }
    load()
    return () => { active = false }
  }, [user?.id, profile?.profile_id, profile?.profile_image_url])

  if (!avatarUrl && !fallbackUrl) return null
  return <img className={className} src={avatarUrl || fallbackUrl} alt={alt} referrerPolicy="no-referrer" onError={() => setAvatarUrl(fallbackUrl)} />
}
