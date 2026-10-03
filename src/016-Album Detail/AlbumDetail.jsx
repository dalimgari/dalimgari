import { useEffect, useState } from 'react'
import { Layout } from '../../components/layout'
import { Loading, EmptyState, ErrorState, MediaContent } from '../../components/ui'
import MediaViewer from '../../components/ui/MediaViewer'
import { getVisibleAlbumByKey } from '../../services/albumService'
import { listVisibleMedia } from '../../services/mediaService'
import { appPath } from '../../lib/routes'

export default function AlbumDetail({ albumKey }) {
  const [album, setAlbum] = useState(null)
  const [media, setMedia] = useState([])
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState(null)
  const [viewer, setViewer] = useState(null)

  useEffect(() => {
    let active = true
    Promise.all([getVisibleAlbumByKey(albumKey), listVisibleMedia()])
      .then(([albumData, mediaData]) => {
        if (!active) return
        setAlbum(albumData)
        setMedia(albumData ? mediaData.filter((item) => item.album_id === albumData.album_id) : [])
        setStatus('ready')
      })
      .catch((requestError) => {
        if (!active) return
        setError(requestError)
        setStatus('error')
      })
    return () => { active = false }
  }, [albumKey])

  return (
    <Layout
      seoTitle={album?.title || 'অ্যালবাম'}
      seoDescription={album?.description || null}
      seoCanonicalPath={`/albums/${albumKey}`}
      navigationItems={[{ label: 'হোম', href: '/' }, { label: 'তথ্য', href: '/information' }, { label: 'পোস্ট', href: '/posts' }, { label: 'অ্যালবাম', href: '/albums' }]}
    >
      <section className="home-section album-detail-page">
        <div className="site-container">
          <a className="back-link" href={appPath('/')}>← হোমে ফিরে যান</a>
          {status === 'loading' ? <Loading /> : null}
          {status === 'error' ? <ErrorState description={error?.message || 'অ্যালবাম লোড করা যায়নি।'} /> : null}
          {status === 'ready' && !album ? <EmptyState description="অ্যালবামটি পাওয়া যায়নি।" /> : null}
          {album ? (
            <article>
              <div className="content-card album-detail__intro">
                <h1>{album.title}</h1>
                {album.description ? <p>{album.description}</p> : null}
              </div>
              {media.length ? (
                <div className="media-grid album-detail__grid">
                  {media.map((item) => (
                    <figure className="media-card" key={item.media_id}>
                      <MediaContent media={item} title={item.file_name || album.title} onImageOpen={setViewer} />
                      {item.file_name ? <figcaption>{item.file_name}</figcaption> : null}
                    </figure>
                  ))}
                </div>
              ) : (
                <p className="gallery-empty">এই অ্যালবামে এখনো কোনো ছবি বা ভিডিও নেই।</p>
              )}
            </article>
          ) : null}
        </div>
      </section>
      {viewer ? <MediaViewer {...viewer} onClose={() => setViewer(null)} /> : null}
    </Layout>
  )
}
