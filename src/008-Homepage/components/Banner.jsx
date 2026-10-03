const HERO_BANNER_URL = 'https://commons.wikimedia.org/wiki/Special:FilePath/Rural_Paddy_Field_Path_Bangladesh.jpg?width=2400'

export default function Banner({ siteName, slogan, imageUrl = HERO_BANNER_URL }) {
  const bannerStyle = {
    backgroundImage: `linear-gradient(90deg, rgb(20 35 18 / .72), rgb(20 35 18 / .28)), url("${imageUrl}")`,
    backgroundPosition: 'center',
    backgroundSize: 'cover',
    color: '#fffaf0',
  }

  return (
    <section className="home-banner" aria-labelledby="home-banner-title" style={bannerStyle}>
      <div className="site-container home-banner__content">
        {siteName ? <h1 id="home-banner-title">{siteName}</h1> : null}
        {slogan ? <p>{slogan}</p> : null}
      </div>
    </section>
  )
}
