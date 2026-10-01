const HERO_BANNER_URL = 'https://commons.wikimedia.org/wiki/Special:FilePath/Rural_Paddy_Field_Path_Bangladesh.jpg?width=2400'

export default function Banner({ siteName, slogan, title, subtitle, showSlogan = true, imageUrl = HERO_BANNER_URL }) {
  return (
    <section className="home-banner" aria-labelledby="home-banner-title" style={{ '--home-banner-image': `url("${imageUrl}")` }}>
      <div className="home-banner__image" aria-hidden="true" />
      <div className="site-container home-banner__content">
        {siteName ? <><p className="eyebrow">আমাদের গ্রাম</p><h1 id="home-banner-title">{title || siteName}</h1></> : null}
        {subtitle ? <p>{subtitle}</p> : showSlogan && slogan ? <p>{slogan}</p> : null}
      </div>
    </section>
  )
}
