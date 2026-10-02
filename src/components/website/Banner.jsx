const HERO_BANNER_URL = 'https://commons.wikimedia.org/wiki/Special:FilePath/Rural_Paddy_Field_Path_Bangladesh.jpg?width=2400'

export default function Banner({ siteName, slogan, title, subtitle, showSlogan = true, imageUrl = HERO_BANNER_URL }) {
  const bannerStyle = {
    backgroundImage: `linear-gradient(90deg, rgb(20 35 18 / .72), rgb(20 35 18 / .28)), url("${imageUrl}")`,
    backgroundPosition: 'center',
    backgroundSize: 'cover',
    color: '#fffaf0',
  }

  return (
    <section className="home-banner" aria-labelledby="home-banner-title" style={bannerStyle}>
      <div className="site-container home-banner__content">
        {siteName ? <><p className="eyebrow" style={{ color: '#fffaf0' }}>আমাদের গ্রাম</p><h1 id="home-banner-title" style={{ color: '#fffaf0', textShadow: '0 2px 8px rgb(0 0 0 / .55)' }}>{title || siteName}</h1></> : null}
        {subtitle ? <p style={{ color: '#fffaf0', textShadow: '0 1px 5px rgb(0 0 0 / .5)' }}>{subtitle}</p> : showSlogan && slogan ? <p style={{ color: '#fffaf0', textShadow: '0 1px 5px rgb(0 0 0 / .5)' }}>{slogan}</p> : null}
      </div>
    </section>
  )
}
