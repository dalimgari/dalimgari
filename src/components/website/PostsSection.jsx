export default function PostsSection({ posts = [] }) {
  return (
    <section className="home-section" aria-labelledby="latest-posts-title">
      <div className="site-container">
        <h2 id="latest-posts-title">সাম্প্রতিক পোস্ট</h2>
        {posts.length ? (
          <div className="content-grid">
            {posts.map((post) => (
              <article className="content-card" key={post.post_id}>
                <h3>{post.title}</h3>
                {post.description ? <p>{post.description}</p> : null}
              </article>
            ))}
          </div>
        ) : (
          <p>এখনও কোনো প্রকাশিত পোস্ট নেই।</p>
        )}
      </div>
    </section>
  )
}
