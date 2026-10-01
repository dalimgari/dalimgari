import { appPath } from '../../lib/routes'

export default function Header({ siteName, slogan }) {
  return (
    <header className="site-header">
      <div className="site-container site-header__inner">
        <a className="site-brand" href={appPath('/')}>
          <span className="site-brand__name">{siteName}</span>
          {slogan ? <span className="site-brand__slogan">{slogan}</span> : null}
        </a>
      </div>
    </header>
  )
}
