import { getMediaPublicUrl } from '../../../services/mediaService'

function youtubeEmbed(url) {
  try {
    const parsed = new URL(url)
    if (parsed.hostname.includes('youtube.com') && parsed.pathname === '/watch') {
      const id = parsed.searchParams.get('v')
      return id ? `https://www.youtube.com/embed/${id}` : null
    }
    if (parsed.hostname === 'youtu.be') {
      const id = parsed.pathname.slice(1)
      return id ? `https://www.youtube.com/embed/${id}` : null
    }
    if (parsed.hostname.includes('youtube.com') && parsed.pathname.startsWith('/embed/')) return url
  } catch {}
  return null
}

function vimeoEmbed(url) {
  try {
    const parsed = new URL(url)
    if (parsed.hostname.includes('vimeo.com') && /^\/\d+/.test(parsed.pathname)) {
      return `https://player.vimeo.com/video/${parsed.pathname.slice(1).split('/')[0]}`
    }
  } catch {}
  return null
}

function mediaKind(media) {
  if (media?.mime_type?.startsWith('image/') || media?.media_type === 'image') return 'image'
  if (media?.mime_type?.startsWith('video/') || media?.media_type === 'video') return 'video'
  if (media?.mime_type?.startsWith('audio/') || media?.media_type === 'audio') return 'audio'
  if (media?.mime_type === 'application/pdf' || media?.media_type === 'document') return 'pdf'
  return 'file'
}

export function getResolvedMediaUrl(media) {
  return media?.media_url || getMediaPublicUrl(media?.storage_path) || null
}

export default function MediaContent({ media, title = 'মিডিয়া', onImageOpen }) {
  const url = getResolvedMediaUrl(media)
  if (!url) return null

  const kind = mediaKind(media)
  if (kind === 'image') {
    const image = <img src={url} alt={media.file_name || title} loading="lazy" />
    if (!onImageOpen) return image
    return <button className="media-card__button" type="button" onClick={() => onImageOpen({ url, alt: media.file_name || title })} aria-label="ছবি বড় করে দেখুন">{image}</button>
  }

  if (kind === 'video') {
    const embed = youtubeEmbed(url) || vimeoEmbed(url)
    return embed
      ? <iframe src={embed} title={media.file_name || title} loading="lazy" allowFullScreen />
      : <video src={url} controls preload="metadata" aria-label={media.file_name || title} />
  }

  if (kind === 'audio') {
    return <audio src={url} controls preload="metadata" aria-label={media.file_name || title} />
  }

  if (kind === 'pdf') {
    return <iframe src={url} title={media.file_name || title} loading="lazy" />
  }

  return <a href={url} target="_blank" rel="noreferrer" className="media-file-link">{media.file_name || 'মিডিয়া ফাইল খুলুন'}</a>
}
