import { useEffect } from 'react'
import Header from './Header'
import Navigation from './Navigation'
import Footer from './Footer'
import { appPath } from '../../lib/routes'

const DEFAULT_DESCRIPTION = 'দালিমগাড়ী গ্রামের তথ্য, সংবাদ, পোস্ট, অ্যালবাম ও কমিউনিটি ওয়েবসাইট।'

function Seo({ title, description, canonicalPath = '/' }) {
  useEffect(() => {
    const siteName = 'দালিমগাড়ী'
    const finalTitle = title ? `${title} | ${siteName}` : siteName
    const finalDescription = description || DEFAULT_DESCRIPTION
    const canonical = new URL(appPath(canonicalPath), window.location.origin).href

    document.title = finalTitle

    const setMeta = (selector, attributes, content) => {
      let element = document.head.querySelector(selector)
      if (!element) {
        element = document.createElement('meta')
        Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value))
        document.head.appendChild(element)
      }
      element.setAttribute('content', content)
    }

    setMeta('meta[name="description"]', { name: 'description' }, finalDescription)
    setMeta('meta[property="og:title"]', { property: 'og:title' }, finalTitle)
    setMeta('meta[property="og:description"]', { property: 'og:description' }, finalDescription)

    let link = document.head.querySelector('link[rel="canonical"]')
    if (!link) {
      link = document.createElement('link')
      link.setAttribute('rel', 'canonical')
      document.head.appendChild(link)
    }
    link.setAttribute('href', canonical)

    return () => {}
  }, [title, description, canonicalPath])

  return null
}

export default function Layout({
  children,
  siteName = 'দালিমগাড়ী',
  slogan = '',
  navigationItems = [],
  copyrightText = '© 2026. All rights reserved.',
  seoTitle,
  seoDescription,
  seoCanonicalPath,
}) {
  return (
    <div className="site-layout">
      <Seo title={seoTitle} description={seoDescription} canonicalPath={seoCanonicalPath || window.location.pathname.replace(import.meta.env.BASE_URL || '/', '/') || '/'} />
      <Header siteName={siteName} slogan={slogan} />
      <Navigation items={navigationItems} />
      <main className="site-main">{children}</main>
      <Footer copyrightText={copyrightText} />
    </div>
  )
}
