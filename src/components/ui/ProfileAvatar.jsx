import { useEffect, useState } from 'react'
import { getCurrentProfile } from '../../services/profileService'
import { getProfileAvatarUrl, getDefaultProfileAvatarUrl } from '../../services/profileAvatarService'

export default function ProfileAvatar({
  user,
  profile = null,
  className = 'site-header__profile-avatar',
  alt = 'Profile',
}) {
  const [avatarUrl, setAvatarUrl] = useState('')
  const [fallbackUrl, setFallbackUrl] = useState('')

  useEffect(() => {
    let active = true

    async function load() {
      let fallback = ''
      try {
        // The database-managed default avatar is the single fallback source.
        fallback = await getDefaultProfileAvatarUrl()
        if (!active) return
        setFallbackUrl(fallback)

        // A supplied profile may belong to another user, so it must be
        // resolved independently of the currently authenticated account.
        const resolvedProfile = profile || (user ? await getCurrentProfile() : null)
        const resolvedAvatar = await getProfileAvatarUrl(resolvedProfile)

        if (!active) return
        setAvatarUrl(resolvedAvatar || fallback)
      } catch {
        if (!active) return
        // Keep the database fallback if it was resolved before a profile
        // lookup failed; never expose a broken/empty profile image.
        setAvatarUrl(fallback)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [user?.id, profile?.profile_id, profile?.profile_image_url])

  if (!avatarUrl && !fallbackUrl) return null

  return (
    <img
      className={className}
      src={avatarUrl || fallbackUrl}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={(event) => {
        const fallback = fallbackUrl
        if (!fallback || event.currentTarget.src === fallback) return
        setAvatarUrl(fallback)
      }}
    />
  )
}
