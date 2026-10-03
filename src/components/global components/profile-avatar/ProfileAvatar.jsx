import { useEffect, useState } from 'react'
import { getCurrentProfile } from '../../../services/profileService'
import { getProfileAvatarUrl, getDefaultProfileAvatarUrl } from '../../../services/profileAvatarService'

const BUILTIN_FALLBACK_AVATAR = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" role="img" aria-label="Profile">' +
  '<circle cx="48" cy="48" r="48" fill="#e9dfc9"/>' +
  '<circle cx="48" cy="36" r="16" fill="#8a7458"/>' +
  '<path d="M20 82c4-17 15-25 28-25s24 8 28 25" fill="#8a7458"/>' +
  '</svg>'
)

export default function ProfileAvatar({
  user,
  profile = null,
  className = 'site-header__profile-avatar',
  alt = 'Profile',
}) {
  const [avatarUrl, setAvatarUrl] = useState(BUILTIN_FALLBACK_AVATAR)
  const [fallbackUrl, setFallbackUrl] = useState(BUILTIN_FALLBACK_AVATAR)

  useEffect(() => {
    let active = true

    async function load() {
      let fallback = BUILTIN_FALLBACK_AVATAR

      try {
        const defaultAvatar = await getDefaultProfileAvatarUrl()
        if (defaultAvatar) fallback = defaultAvatar
      } catch {
        // Built-in fallback remains available when the DB avatar cannot load.
      }

      if (!active) return
      setFallbackUrl(fallback)

      try {
        const resolvedProfile = profile || (user ? await getCurrentProfile() : null)
        const resolvedAvatar = await getProfileAvatarUrl(resolvedProfile)

        if (!active) return
        setAvatarUrl(resolvedAvatar || fallback)
      } catch {
        if (!active) return
        setAvatarUrl(fallback)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [user?.id, profile?.profile_id, profile?.profile_image_url])

  return (
    <img
      className={className}
      src={avatarUrl || fallbackUrl || BUILTIN_FALLBACK_AVATAR}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={(event) => {
        const fallback = fallbackUrl || BUILTIN_FALLBACK_AVATAR
        if (event.currentTarget.src === fallback) return
        event.currentTarget.src = fallback
        setAvatarUrl(fallback)
      }}
    />
  )
}
