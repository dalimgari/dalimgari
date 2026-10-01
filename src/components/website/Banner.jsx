export default function Banner({ siteName, slogan, title, subtitle, showSlogan = true }) {
  return (
    <section className="home-banner" aria-labelledby="home-banner-title">
      <div className="site-container">
        {siteName ? <><p className="eyebrow">আমাদের গ্রাম</p><h1 id="home-banner-title">{title || siteName}</h1></> : null}
        {subtitle ? <p>{subtitle}</p> : showSlogan && slogan ? <p>{slogan}</p> : null}
      </div>
    </section>
  )
}
