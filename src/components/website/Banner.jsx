export default function Banner({ siteName, slogan }) {
  return (
    <section className="home-banner" aria-labelledby="home-banner-title">
      <div className="site-container">
        {siteName ? <><p className="eyebrow">আমাদের গ্রাম</p><h1 id="home-banner-title">{siteName}</h1></> : null}
        {slogan ? <p>{slogan}</p> : null}
      </div>
    </section>
  )
}
