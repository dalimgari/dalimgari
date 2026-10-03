import { appPath } from '../../lib/routes'

export default function AlbumsSection({ albums = [] }) {
  return (
    <section className="home-section" aria-labelledby="albums-title">
      <div className="site-container">
        <h2 id="albums-title">অ্যালবাম</h2>
        {albums.length ? (
          <div className="content-grid">
            {albums.map((album) => (
              <a className="content-card home-album-card" href={appPath(`/albums/${encodeURIComponent(album.album_key)}`)} key={album.album_id}>
                <h3>{album.title}</h3>
                {album.description ? <p>{album.description}</p> : null}
              </a>
            ))}
          </div>
        ) : (
          <p>এখনও কোনো দৃশ্যমান অ্যালবাম নেই।</p>
        )}
      </div>
    </section>
  )
}
