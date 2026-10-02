import { useEffect, useState } from 'react'
import { usePreferences } from '../../context/PreferencesContext'
import Header from './Header'
import Sidebar from './Sidebar'
import Footer from './Footer'
import { appPath } from '../../lib/routes'
import { getWebsiteInformation, getRuralVisualSettings } from '../../services/websiteService'
import { useGlobalLabels } from '../../context'
import { getThemeSettings } from '../../services/themeService'
import { trackPageView } from '../../services/analyticsService'

const ROUTE_TITLES = {
  '/': { bng: 'হোম', eng: 'Home' },
  '/information': { bng: 'গ্রামের তথ্য', eng: 'Village Information' },
  '/posts': { bng: 'পোস্ট', eng: 'Posts' },
  '/albums': { bng: 'অ্যালবাম', eng: 'Albums' },
  '/search': { bng: 'খুঁজুন', eng: 'Search' },
  '/login': { bng: 'লগইন', eng: 'Login' },
  '/signup': { bng: 'নতুন একাউন্ট', eng: 'Create Account' },
  '/profile': { bng: 'প্রোফাইল', eng: 'Profile' },
  '/dashboard': { bng: 'ড্যাশবোর্ড', eng: 'Dashboard' },
}

function Seo({ siteName, title, description, canonicalPath }) {
  useEffect(() => {
    const finalTitle = title || siteName || ''
    if (finalTitle) document.title = finalTitle

    const setMeta = (selector, attributes, content) => {
      let element = document.head.querySelector(selector)
      if (!content) {
        element?.remove()
        return
      }
      if (!element) {
        element = document.createElement('meta')
        Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value))
        document.head.appendChild(element)
      }
      element.setAttribute('content', content)
    }

    setMeta('meta[name="description"]', { name: 'description' }, description)
    setMeta('meta[property="og:title"]', { property: 'og:title' }, finalTitle)
    setMeta('meta[property="og:description"]', { property: 'og:description' }, description)

    let link = document.head.querySelector('link[rel="canonical"]')
    if (!link) {
      link = document.createElement('link')
      link.setAttribute('rel', 'canonical')
      document.head.appendChild(link)
    }
    link.setAttribute('href', new URL(appPath(canonicalPath || '/'), window.location.origin).href)
  }, [siteName, title, description, canonicalPath])
  return null
}

function applyThemeSettings(settings, theme) {
  const root = document.documentElement
  const palette = settings?.[theme] || {}
  if (palette.wallpaper) root.style.setProperty('--rural-wallpaper', 'url("' + palette.wallpaper + '")')

  const icons = palette.icons || {}
  if (icons.color) root.style.setProperty('--theme-icon-color', String(icons.color))
  if (icons.size) root.style.setProperty('--theme-icon-size', String(icons.size))
  if (icons.strokeWidth) root.style.setProperty('--theme-icon-stroke-width', String(icons.strokeWidth))
  if (icons.opacity) root.style.setProperty('--theme-icon-opacity', String(icons.opacity))
  if (icons.shadow) root.style.setProperty('--theme-icon-shadow', String(icons.shadow))

  const colors = palette.colors || {}
  const states = palette.states || {}
  const interaction = palette.interaction || {}
  const shape = palette.shape || {}
  const shadow = palette.shadow || {}
  const typography = palette.typography || {}
  const scrollbar = palette.scrollbar || {}
  const vars = {
    earth: colors.earth, earthDark: colors.earthDark, leaf: colors.leaf, leafDark: colors.leafDark,
    paddy: colors.paddy, field: colors.field, water: colors.water, clay: colors.clay, sun: colors.sun,
    page: colors.page, surface: colors.surface, surfaceSoft: colors.surfaceSoft, text: colors.text,
    muted: colors.muted, border: colors.border, focus: colors.focus, shadow: colors.shadow,
    header: colors.header, footer: colors.footer, input: colors.input, hover: colors.hover,
    success: states.success, warning: states.warning, error: states.error, info: states.info,
    hoverOpacity: interaction.hoverOpacity, activeOpacity: interaction.activeOpacity,
    disabledOpacity: interaction.disabledOpacity, radius: shape.radius, buttonRadius: shape.buttonRadius,
    borderWidth: shape.borderWidth, shadowCard: shadow.card, shadowDropdown: shadow.dropdown,
    shadowModal: shadow.modal, headingWeight: typography.headingWeight, bodyWeight: typography.bodyWeight,
    lineHeight: typography.lineHeight, scrollbarThumb: scrollbar.thumb, scrollbarTrack: scrollbar.track,
  }
  Object.entries(vars).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') root.style.setProperty('--theme-' + key, String(value))
  })
}

function applyRuralVisualSettings(settings) {
  if (!settings) return
  const root = document.documentElement
  if (settings.wallpaper_position) root.style.setProperty('--rural-wallpaper-position', settings.wallpaper_position)
  if (settings.wallpaper_size) root.style.setProperty('--rural-wallpaper-size', settings.wallpaper_size)
  const text = settings.text_styles || {}
  if (text.heading_font) root.style.setProperty('--rural-heading-font', "'" + text.heading_font + "', 'Noto Serif Bengali', Georgia, serif")
  if (text.body_font) root.style.setProperty('--rural-body-font', "'" + text.body_font + "', 'Noto Sans Bengali', sans-serif")
  if (text.heading_weight) root.style.setProperty('--rural-heading-weight', String(text.heading_weight))
  const component = settings.component_styles || {}
  if (component.radius) root.style.setProperty('--rural-radius', component.radius)
}

export default function Layout({ children, siteName, navigationItems = [], copyrightText, seoTitle, seoDescription, seoCanonicalPath }) {
  const { theme, language, deviceClass } = usePreferences()
  const { t } = useGlobalLabels()
  const [websiteInformation, setWebsiteInformation] = useState(null)
  const [visualSettings, setVisualSettings] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [themeSettings, setThemeSettings] = useState(null)

  useEffect(() => {
    let active = true
    Promise.allSettled([getWebsiteInformation(), getRuralVisualSettings(), getThemeSettings()])
      .then(([info, visual, themeResult]) => {
        if (!active) return
        if (info.status === 'fulfilled') setWebsiteInformation(info.value)
        if (visual.status === 'fulfilled') {
          setVisualSettings(visual.value)
          applyRuralVisualSettings(visual.value)
        }
        if (themeResult.status === 'fulfilled') {
          setThemeSettings(themeResult.value)
          applyThemeSettings(themeResult.value, theme)
        }
      })
    return () => { active = false }
  }, [theme])

  useEffect(() => {
    if (visualSettings) applyRuralVisualSettings(visualSettings)
    if (themeSettings) applyThemeSettings(themeSettings, theme)
  }, [visualSettings, themeSettings, theme])

  const resolvedSiteName = siteName ?? websiteInformation?.village_name
  const resolvedCopyright = copyrightText ?? websiteInformation?.copyright_text
  const canonicalPath = seoCanonicalPath || (() => {
    const base = import.meta.env.BASE_URL || '/'
    const pathname = window.location.pathname
    if (base !== '/' && pathname.startsWith(base)) return pathname.slice(base.length - 1) || '/'
    return pathname || '/'
  })()
  const routeTitle = ROUTE_TITLES[canonicalPath]
  const resolvedSeoTitle = seoTitle || routeTitle?.[language] || routeTitle?.bng || null

  useEffect(() => {
    trackPageView({ path: canonicalPath, deviceClass, language, theme }).catch(() => {})
  }, [canonicalPath, deviceClass, language, theme])

  return (
    <div className="site-layout">
      <a className="skip-link" href="#main-content">{t('skip_to_main', 'মূল জায়গায় যান', 'Skip to main content')}</a>
      <Seo siteName={resolvedSiteName} title={resolvedSeoTitle} description={seoDescription} canonicalPath={canonicalPath} />
      <Header pageTitle={resolvedSeoTitle || t('home', 'হোম', 'Home')} sidebarOpen={sidebarOpen} showSearch canonicalPath={canonicalPath} onMenu={() => setSidebarOpen((value) => !value)} />
      <div className={'site-content-area' + (sidebarOpen ? ' sidebar-visible' : '')}>
        <Sidebar items={navigationItems} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main id="main-content" className="site-main" data-content-slot="dynamic">{children}</main>
      </div>
      <Footer copyrightText={resolvedCopyright} />
    </div>
  )
}
