export default function HomePage() {
  return (
    <>
      <section className="hero" aria-labelledby="hero-title">
        <p className="eyebrow">A connected village community</p>
        <h1 id="hero-title">Welcome to Dalimgari</h1>
        <p className="lead">
          A new digital home for village stories, community updates, people,
          photographs, and shared memories.
        </p>
        <div className="actions">
          <a className="button" href="/about">Discover Dalimgari</a>
          <a className="button secondary" href="/login">Community login</a>
        </div>
      </section>
      <section className="section" aria-labelledby="platform-title">
        <h2 id="platform-title">One place for our community</h2>
        <div className="section-grid">
          <article className="card">
            <h3>Village pages</h3>
            <p>Community information and village history, managed through the application.</p>
          </article>
          <article className="card">
            <h3>Albums and gallery</h3>
            <p>A structured home for village photographs and shared memories.</p>
          </article>
          <article className="card">
            <h3>Community profiles</h3>
            <p>Secure accounts and role-based access for community members.</p>
          </article>
        </div>
      </section>
    </>
  );
}
