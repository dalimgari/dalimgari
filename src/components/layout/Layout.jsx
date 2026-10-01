import { useEffect } from 'react'
import Header from './Header'
import Navigation from './Navigation'
import Footer from './Footer'
import { appPath } from '../../lib/routes'

const DEFAULT_DESCRIPTION = 'ডালিমগাড়ী গ্রামের তথ্য, সংবাদ, পোস্ট, অ্যালবাম ও কমিউনিটি ওয়েবসাইট।'
const ROUTE_SEO = {
  '/': { title: 'হোম', description: DEFAULT_DESCRIPTION },
  '/information': { title: 'গ্রামের তথ্য', description: 'ডালিমগাড়ী গ্রামের পরিচিতি, অবস্থান ও গুরুত্বপূর্ণ তথ্য।' },
  '/posts': { title: 'পোস্ট', description: 'ডালিমগাড়ী গ্রামের প্রকাশিত পোস্ট ও সংবাদ।' },
  '/albums': { title: 'অ্যালবাম', description: 'ডালিমগাড়ী গ্রামের ছবি ও অ্যালবাম।' },
  '/search': { title: 'সার্চ', description: 'ডালিমগাড়ী গ্রামের পোস্ট ও পেজ খুঁজুন।' },
  '/login': { title: 'লগইন', description: 'ডালিমগাড়ী ওয়েবসাইটে নিরাপদে লগইন করুন।' },
}

function Seo({ title, description, canonicalPath }) {
  useEffect(() => {
    const siteName = 'ডালিমগাড়ী'
    const routeKey = canonicalPath || '/'
    const routeSeo = ROUTE_SEO[routeKey] || {}
    const finalTitle = title || routeSeo.title || siteName
    const finalDescription = description || routeSeo.description || DEFAULT_DESCRIPTION
    const fullTitle = finalTitle === siteName ? siteName : `${finalTitle} | ${siteName}`
    const canonical = new URL(appPath(routeKey), window.location.origin).href

    document.title = fullTitle

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
    setMeta('meta[property="og:title"]', { property: 'og:title' }, fullTitle)
    setMeta('meta[property="og:description"]', { property: 'og:description' }, finalDescription)

    let link = document.head.querySelector('link[rel="canonical"]')
    if (!link) {
      link = document.createElement('link')
      link.setAttribute('rel', 'canonical')
      document.head.appendChild(link)
    }
    link.setAttribute('href', canonical)
  }, [title, description, canonicalPath])

  return null
}

export default function Layout({
  children,
  siteName = 'ডালিমগাড়ী',
  slogan = '',
  navigationItems = [],
  copyrightText = '© 2026. All rights reserved.',
  seoTitle,
  seoDescription,
  seoCanonicalPath,
}) {
  const canonicalPath = seoCanonicalPath || (() => {
    const base = import.meta.env.BASE_URL || '/'
    const pathname = window.location.pathname
    if (base !== '/' && pathname.startsWith(base)) return pathname.slice(base.length - 1) || '/'
    return pathname || '/'
  })()

  return (
    <div className="site-layout">
      <Seo title={seoTitle} description={seoDescription} canonicalPath={canonicalPath} />
      <Header siteName={siteName} slogan={slogan} />
      <Navigation items={navigationItems} />
      <main className="site-main">{children}</main>
      <Footer copyrightText={copyrightText} />
    </div>
  )
}
