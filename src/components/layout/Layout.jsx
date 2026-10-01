import { useEffect, useState } from 'react'
import { usePreferences } from '../../context/PreferencesContext'
import Header from './Header'
import Sidebar from './Sidebar'
import Footer from './Footer'
import { appPath } from '../../lib/routes'
import { getWebsiteInformation, getRuralVisualSettings } from '../../services/websiteService'
import { getGlobalLabels } from '../../services/globalLabelService'
import { getThemeSettings } from '../../services/themeService'
const ROUTE_TITLES={ '/':'বাড়ি','/information':'গ্রামের কথা','/posts':'গ্রামের খবর','/albums':'ছবির খাতা','/search':'খোঁজ','/login':'ঘরে ঢোকার ঘর','/profile':'নিজের পরিচয়' }
function Seo({siteName,title,description,canonicalPath}){useEffect(()=>{const routeKey=canonicalPath||'/';const finalTitle=title||siteName||'';const fullTitle=finalTitle&&siteName&&finalTitle!==siteName?`${finalTitle} | ${siteName}`:finalTitle;if(fullTitle)document.title=fullTitle;const setMeta=(selector,attributes,content)=>{let element=document.head.querySelector(selector);if(!content){element?.remove();return}if(!element){element=document.createElement('meta');Object.entries(attributes).forEach(([key,value])=>element.setAttribute(key,value));document.head.appendChild(element)}element.setAttribute('content',content)};setMeta('meta[name="description"]',{name:'description'},description);setMeta('meta[property="og:title"]',{property:'og:title'},fullTitle);setMeta('meta[property="og:description"]',{property:'og:description'},description);let link=document.head.querySelector('link[rel="canonical"]');if(!link){link=document.createElement('link');link.setAttribute('rel','canonical');document.head.appendChild(link)}link.setAttribute('href',new URL(appPath(routeKey),window.location.origin).href)},[siteName,title,description,canonicalPath]);return null}

function applyThemeSettings(settings, theme) {
  const root = document.documentElement
  const palette = settings?.[theme] || {}
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
    hoverOpacity: interaction.hoverOpacity, activeOpacity: interaction.activeOpacity, disabledOpacity: interaction.disabledOpacity,
    radius: shape.radius, buttonRadius: shape.buttonRadius, borderWidth: shape.borderWidth,
    shadowCard: shadow.card, shadowDropdown: shadow.dropdown, shadowModal: shadow.modal,
    headingWeight: typography.headingWeight, bodyWeight: typography.bodyWeight, lineHeight: typography.lineHeight,
    scrollbarThumb: scrollbar.thumb, scrollbarTrack: scrollbar.track
  }
  Object.entries(vars).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') root.style.setProperty(`--theme-${key}`, String(value))
  })
}

function applyRuralVisualSettings(settings,theme,deviceClass){if(!settings)return;const root=document.documentElement;const day=settings.wallpaper_day_url||settings.wallpaper_url||'/assets/rural-bengal-wallpaper.svg';const night=settings.wallpaper_night_url||'/assets/rural-bengal-night-wallpaper.svg';const dayMobile=settings.wallpaper_day_mobile_url||settings.wallpaper_mobile_url||day;const nightMobile=settings.wallpaper_night_mobile_url||night;const activeDay=deviceClass==='mobile'?dayMobile:day;const activeNight=deviceClass==='mobile'?nightMobile:night;root.style.setProperty('--rural-wallpaper-day',`url("${day}")`);root.style.setProperty('--rural-wallpaper-night',`url("${night}")`);root.style.setProperty('--rural-wallpaper',`url("${theme==='dark'?night:day}")`);if(settings.wallpaper_position)root.style.setProperty('--rural-wallpaper-position',settings.wallpaper_position);if(settings.wallpaper_size)root.style.setProperty('--rural-wallpaper-size',settings.wallpaper_size);const text=settings.text_styles||{};if(text.heading_font)root.style.setProperty('--rural-heading-font',`'${text.heading_font}', 'Noto Serif Bengali', Georgia, serif`);if(text.body_font)root.style.setProperty('--rural-body-font',`'${text.body_font}', 'Noto Sans Bengali', sans-serif`);if(text.heading_weight)root.style.setProperty('--rural-heading-weight',String(text.heading_weight));const component=settings.component_styles||{};if(component.radius)root.style.setProperty('--rural-radius',component.radius)}
export default function Layout({children,siteName,slogan,navigationItems=[],copyrightText,seoTitle,seoDescription,seoCanonicalPath}){const {theme,deviceClass}=usePreferences();const [websiteInformation,setWebsiteInformation]=useState(null);const [visualSettings,setVisualSettings]=useState(null);const [sidebarOpen,setSidebarOpen]=useState(false);const [labels,setLabels]=useState({});const [themeSettings,setThemeSettings]=useState(null);useEffect(()=>{let active=true;Promise.allSettled([getWebsiteInformation(),getRuralVisualSettings(),getGlobalLabels(),getThemeSettings() ]).then(([info,visual,labelResult,themeResult])=>{if(!active)return;if(info.status==='fulfilled')setWebsiteInformation(info.value);if(visual.status==='fulfilled'){setVisualSettings(visual.value);applyRuralVisualSettings(visual.value,theme,deviceClass)}if(labelResult.status==='fulfilled')setLabels(labelResult.value);if(themeResult?.status==='fulfilled'){setThemeSettings(themeResult.value);applyThemeSettings(themeResult.value,theme)}});return()=>{active=false}},[]);useEffect(()=>{if(visualSettings)applyRuralVisualSettings(visualSettings,theme,deviceClass);if(themeSettings)applyThemeSettings(themeSettings,theme)},[visualSettings,themeSettings,theme]);const resolvedSiteName=siteName??websiteInformation?.village_name;const resolvedSlogan=slogan??websiteInformation?.slogan;const resolvedCopyright=copyrightText??websiteInformation?.copyright_text;const canonicalPath=seoCanonicalPath||(()=>{const base=import.meta.env.BASE_URL||'/';const pathname=window.location.pathname;if(base!=='/'&&pathname.startsWith(base))return pathname.slice(base.length-1)||'/';return pathname||'/'})();return <div className="site-layout"><a className="skip-link" href="#main-content">মূল জায়গায় যান</a><Seo siteName={resolvedSiteName} title={seoTitle||ROUTE_TITLES[canonicalPath]||null} description={seoDescription} canonicalPath={canonicalPath}/><Header siteName={resolvedSiteName} slogan={resolvedSlogan} labels={labels} sidebarOpen={sidebarOpen} onMenu={()=>setSidebarOpen(v=>!v)}/><div className={`site-body${sidebarOpen?' sidebar-visible':''}`}><Sidebar items={navigationItems} open={sidebarOpen} onClose={()=>setSidebarOpen(false)} labels={labels}/><main id="main-content" className="site-main">{children}</main></div><Footer copyrightText={resolvedCopyright}/></div>}
