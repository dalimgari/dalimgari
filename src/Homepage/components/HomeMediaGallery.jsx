import { appPath } from '../../lib/routes'
import { useMemo, useState } from 'react'
import MediaContent from '../../018-Media/MediaContent'
import MediaViewer from '../ui/MediaViewer'

function mediaKind(media) {
  if (media?.mime_type?.startsWith('image/') || media?.media_type === 'image') return 'image'
  if (media?.mime_type?.startsWith('video/') || media?.media_type === 'video') return 'video'
  return null
}

export default function HomeMediaGallery({ albums = [], media = [], title = 'গ্যালারি', subtitle = 'ছবি ও ভিডিও', showAll = true, albumIds = [] }) {
  const [activeAlbum, setActiveAlbum] = useState('all')
  const [viewer, setViewer] = useState(null)

  const galleryMedia = useMemo(
    () => media.filter((item) => mediaKind(item) && (activeAlbum === 'all' || item.album_id === activeAlbum) && (!albumIds?.length || albumIds.includes(item.album_id))),
    [media, activeAlbum],
  )

  const visibleAlbums = useMemo(
    () => albums.filter((album) => (!albumIds?.length || albumIds.includes(album.album_id)) && media.some((item) => item.album_id === album.album_id && mediaKind(item))),
    [albums, media],
  )

  return (
    <section className="home-section home-media-section" id="media-gallery" aria-labelledby="home-media-title">
      <div className="site-container">
        <div className="section-heading">
          <div>
            <p className="section-kicker">{subtitle}</p>
            <h2 id="home-media-title">{title}</h2>
          </div>
          <a className="content-card__link" href={appPath('/albums')}>সব অ্যালবাম দেখুন</a>
        </div>

        {visibleAlbums.length || media.some((item) => mediaKind(item)) ? (
          <>
            <div className="gallery-tabs" role="tablist" aria-label="গ্যালারি অ্যালবাম">
              {showAll ? <button
                type="button"
                role="tab"
                aria-selected={activeAlbum === 'all'}
                className={activeAlbum === 'all' ? 'gallery-tab is-active' : 'gallery-tab'}
                onClick={() => setActiveAlbum('all')}
              >
                সব
              </button> : null}
              {visibleAlbums.map((album) => (
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeAlbum === album.album_id}
                  className={activeAlbum === album.album_id ? 'gallery-tab is-active' : 'gallery-tab'}
                  key={album.album_id}
                  onClick={() => setActiveAlbum(album.album_id)}
                >
                  {album.title}
                </button>
              ))}
            </div>

            {galleryMedia.length ? (
              <div className="media-grid home-media-grid">
                {galleryMedia.map((item) => (
                  <figure className="media-card home-media-card" key={item.media_id}>
                    <MediaContent
                      media={item}
                      title={item.file_name || 'ছবি বা ভিডিও'}
                      onImageOpen={setViewer}
                    />
                    <figcaption>
                      {item.file_name || 'ছবি/ভিডিও'}
                    </figcaption>
                  </figure>
                ))}
              </div>
            ) : (
              <p className="gallery-empty">এই অ্যালবামে এখনো কোনো ছবি বা ভিডিও নেই।</p>
            )}
          </>
        ) : (
          <p className="gallery-empty">এখনো কোনো ছবি বা ভিডিও প্রকাশ করা হয়নি।</p>
        )}
      </div>

      {viewer ? <MediaViewer {...viewer} onClose={() => setViewer(null)} /> : null}
    </section>
  )
}
