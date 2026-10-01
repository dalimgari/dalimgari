import { appPath } from '../../lib/routes'

function RuralIcon({ name }) {
  const paths = {
    back: <><path d="M19 12H5"/><path d="m11 18-6-6 6-6"/></>,
    hut: <><path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10.5V20h13v-9.5"/><path d="M9 20v-5h6v5"/><path d="M7 12h.01M17 12h.01"/></>,
  }
  return <svg className="rural-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}

export default function Header({ siteName, slogan }) {
  function goBack() {
    if (window.history.length > 1) window.history.back()
    else window.location.href = appPath('/')
  }

  return (
    <header className="site-header">
      <div className="site-container site-header__inner">
        <button className="site-header__back" type="button" onClick={goBack} aria-label="পেছনে ফিরে যান">
          <RuralIcon name="back" />
          <span>পেছনে</span>
        </button>
        <a className="site-brand" href={appPath('/')}>
          <span className="site-brand__mark"><RuralIcon name="hut" /></span>
          <span className="site-brand__words">
            <span className="site-brand__name">{siteName}</span>
            {slogan ? <span className="site-brand__slogan">{slogan}</span> : null}
          </span>
        </a>
      </div>
    </header>
  )
}
