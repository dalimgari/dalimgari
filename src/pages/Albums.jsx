import { useEffect, useState } from 'react'
import { Layout } from '../components/layout'
import { Loading, EmptyState, ErrorState } from '../components/ui'
import { listVisibleAlbums } from '../services/albumService'
import { listVisibleMedia, getMediaPublicUrl } from '../services/mediaService'
import MediaViewer from '../components/ui/MediaViewer'

function getMediaUrl(media) { return media.media_url || getMediaPublicUrl(media.storage_path) }

export default function Albums() {
  const [albums, setAlbums] = useState([])
  const [mediaByAlbum, setMediaByAlbum] = useState({})
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState(null)
  const [viewer, setViewer] = useState(null)

  useEffect(() => {
    let active = true
    Promise.all([listVisibleAlbums(), listVisibleMedia()])
      .then(([albumData, mediaData]) => {
        if (!active) return
        const grouped = mediaData.reduce((groups, media) => {
          const key = media.album_id || 'unassigned'
          if (!groups[key]) groups[key] = []
          groups[key].push(media)
          return groups
        }, {})
        setAlbums(albumData); setMediaByAlbum(grouped); setStatus('ready')
      })
      .catch((requestError) => { if (active) { setError(requestError); setStatus('error') } })
    return () => { active = false }
  }, [])

  return <Layout navigationItems={[{ label: 'হোম', href: '/' }, { label: 'তথ্য', href: '/information' }, { label: 'পোস্ট', href: '/posts' }, { label: 'অ্যালবাম', href: '/albums' }, { label: 'সার্চ', href: '/search' }]}>
    <section className="home-section"><div className="site-container">
      <h1>অ্যালবাম</h1>
      {status === 'loading' ? <Loading /> : null}
      {status === 'error' ? <ErrorState description={error?.message || 'অ্যালবাম লোড করা যায়নি।'} /> : null}
      {status === 'ready' && !albums.length ? <EmptyState description="এখনও কোনো দৃশ্যমান অ্যালবাম নেই।" /> : null}
      {status === 'ready' && albums.length ? albums.map((album) => <section className="album-block" key={album.album_id}>
        <h2>{album.title}</h2>
        {album.description ? <p>{album.description}</p> : null}
        {mediaByAlbum[album.album_id]?.length ? <div className="media-grid">
          {mediaByAlbum[album.album_id].map((media) => {
            const url = getMediaUrl(media)
            return url ? <figure className="media-card" key={media.media_id}><button className="media-card__button" type="button" onClick={() => setViewer({ url, alt: media.file_name || album.title })} aria-label="ছবি বড় করে দেখুন"><img src={url} alt={media.file_name || album.title} loading="lazy" /></button></figure> : null
          })}
        </div> : <p>এই অ্যালবামে এখনও কোনো ছবি নেই।</p>}
      </section>) : null}
      {viewer ? <MediaViewer {...viewer} onClose={() => setViewer(null)} /> : null}
    </div></section>
  </Layout>
}
