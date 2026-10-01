import Header from './Header'
import Navigation from './Navigation'
import Footer from './Footer'

export default function Layout({
  children,
  siteName = 'দালিমগাড়ী',
  slogan = '',
  navigationItems = [],
  copyrightText = '© 2026. All rights reserved.',
}) {
  return (
    <div className="site-layout">
      <Header siteName={siteName} slogan={slogan} />
      <Navigation items={navigationItems} />
      <main className="site-main">{children}</main>
      <Footer copyrightText={copyrightText} />
    </div>
  )
}
