import { appPath } from '../../lib/routes'

export default function Header({ siteName, slogan }) {
  function goBack() {
    if (window.history.length > 1) window.history.back()
    else window.location.href = appPath('/')
  }

  return (
    <header className="site-header">
      <div className="site-container site-header__inner">
        <button className="site-header__back" type="button" onClick={goBack} aria-label="পেছনে ফিরে যান">
          <span aria-hidden="true">←</span>
          <span>পেছনে</span>
        </button>
        <a className="site-brand" href={appPath('/')}>
          <span className="site-brand__name">{siteName}</span>
          {slogan ? <span className="site-brand__slogan">{slogan}</span> : null}
        </a>
      </div>
    </header>
  )
}
