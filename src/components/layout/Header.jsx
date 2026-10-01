export default function Header({ siteName = 'দালিমগাড়ী', slogan = '' }) {
  return (
    <header className="site-header">
      <div className="site-container site-header__inner">
        <a className="site-brand" href="/">
          <span className="site-brand__name">{siteName}</span>
          {slogan ? <span className="site-brand__slogan">{slogan}</span> : null}
        </a>
      </div>
    </header>
  )
}
