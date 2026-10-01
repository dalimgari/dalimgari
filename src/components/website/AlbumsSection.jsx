export default function AlbumsSection({ albums = [] }) {
  return (
    <section className="home-section" aria-labelledby="albums-title">
      <div className="site-container">
        <h2 id="albums-title">অ্যালবাম</h2>
        {albums.length ? (
          <div className="content-grid">
            {albums.map((album) => (
              <article className="content-card" key={album.album_id}>
                <h3>{album.title}</h3>
                {album.description ? <p>{album.description}</p> : null}
              </article>
            ))}
          </div>
        ) : (
          <p>এখনও কোনো দৃশ্যমান অ্যালবাম নেই।</p>
        )}
      </div>
    </section>
  )
}
