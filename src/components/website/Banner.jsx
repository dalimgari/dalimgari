export default function Banner({ siteName, slogan }) {
  return (
    <section className="home-banner" aria-labelledby="home-banner-title">
      <div className="site-container">
        <p className="eyebrow">আমাদের গ্রাম</p>
        <h1 id="home-banner-title">{siteName || 'দালিমগাড়ী'}</h1>
        {slogan ? <p>{slogan}</p> : null}
      </div>
    </section>
  )
}
