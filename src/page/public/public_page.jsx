import { createElement, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { website_layout } from '../../layout/website/website_layout'
import { header } from '../../component/navigation/header'
import { banner } from '../../component/common/banner'
import { footer } from '../../component/common/footer'
import { page_navigation } from '../../component/navigation/page_navigation'
import { post_list } from '../../component/post/post_list'
import { website_skeleton } from '../../component/common/website_skeleton'
import { get_website_information, get_public_links, get_admin_information, get_public_pages, get_public_posts, get_public_customization, get_public_seo_settings } from '../../service/supabase/website_service.js'
import { apply_customization } from '../../function/customization/apply_customization'
import { apply_theme_settings } from '../../function/customization/customization'
import { record_visit } from '../../function/analytics/record_visit'
import { apply_seo } from '../../function/seo/apply_seo'
import { get_localized_value } from '../../function/translation/language'
import { get_saved_language, save_language } from '../../function/translation/language_storage'
import { get_theme_mode, apply_theme_mode, set_manual_theme_mode, subscribe_to_system_theme } from '../../function/theme/theme_mode'
import { public_search } from '../../component/navigation/public_search'
import { get_information_map, get_information_value, get_information_contact_icon } from './public_information'
import { sanitize_html } from '../../function/page/render_html'

const empty_state = { loading: true, error: null, information: [], links: [], admin_information: null, pages: [], posts: [], customization: [], seo_settings: [] }

function render_home_page(state, language) {
  const information = get_information_map(state.information)
  const village_name = get_information_value(information, 'village_name', language)
  const village_description = get_information_value(information, 'village_description', language)
  const address_parts = ['union', 'upazila', 'district', 'post_office', 'postal_code'].map((key) => get_information_value(information, key, language)).filter(Boolean)
  const contact_phone = get_information_value(information, 'contact_phone', language)
  const contact_whatsapp = get_information_value(information, 'contact_whatsapp', language)
  const contact_email = get_information_value(information, 'contact_email', language)

  return createElement('main', { id: 'public-home', className: 'website-body' },
    village_description && createElement('section', { id: 'public-village_description', className: 'home-welcome website-section' },
      createElement('div', { className: 'website-eyebrow' }, language === 'bn' ? 'পরিচিতি' : 'Introduction'),
      createElement('h2', null, language === 'bn' ? 'আমাদের গ্রাম' : 'Our village'),
      createElement('p', { className: 'website-lead-text' }, village_description)
    ),
    state.pages.some((page) => page.page_slug) && createElement('section', { id: 'public-pages', className: 'home-navigation website-section' },
      createElement('div', { className: 'website-section-heading' },
        createElement('div', null,
          createElement('div', { className: 'website-eyebrow' }, language === 'bn' ? 'জানুন' : 'Explore'),
          createElement('h2', null, language === 'bn' ? 'গ্রাম সম্পর্কে আরও জানুন' : 'Explore more')
        )
      ),
      createElement(page_navigation, { pages: state.pages.filter((page) => page.page_slug), language })
    ),
    state.posts.length > 0 && createElement('section', { id: 'public-posts', className: 'home-posts website-section' },
      createElement('div', { className: 'website-section-heading' },
        createElement('div', null,
          createElement('div', { className: 'website-eyebrow' }, language === 'bn' ? 'সর্বশেষ' : 'Latest'),
          createElement('h2', null, language === 'bn' ? 'সর্বশেষ খবর ও পোস্ট' : 'Latest news and posts')
        )
      ),
      createElement(post_list, { posts: state.posts, language })
    ),
    address_parts.length > 0 && createElement('section', { id: 'public-contact', className: 'home-contact website-section' },
      createElement('div', { className: 'website-section-heading' },
        createElement('div', null,
          createElement('div', { className: 'website-eyebrow' }, language === 'bn' ? 'যোগাযোগ' : 'Contact'),
          createElement('h2', null, language === 'bn' ? 'যোগাযোগের তথ্য' : 'Contact information')
        )
      ),
      createElement('p', { className: 'contact-address' }, [village_name, ...address_parts].filter(Boolean).join(' • ')),
      createElement('div', { className: 'contact-actions' },
        contact_phone && createElement('a', { className: 'website-contact-action primary', href: `tel:${contact_phone}`, 'aria-label': 'Call', title: 'Call' }, get_information_contact_icon('phone', createElement)),
        contact_whatsapp && createElement('a', { className: 'website-contact-action whatsapp', href: `https://wa.me/${String(contact_whatsapp).replace(/[^0-9+]/g, '').replace(/^\+/, '')}`, target: '_blank', rel: 'noreferrer', 'aria-label': 'WhatsApp', title: 'WhatsApp' }, get_information_contact_icon('whatsapp', createElement)),
        contact_email && createElement('a', { className: 'website-contact-action email', href: `mailto:${contact_email}`, 'aria-label': 'Email', title: 'Email' }, get_information_contact_icon('email', createElement))
      )
    )
  )
}

function render_dynamic_page(state, language, pathname) {
  const slug = pathname.replace(/^\/+|\/+$/g, '')
  const page = state.pages.find((item) => item.page_slug === slug && item.page_slug)
  return createElement('main', { className: 'website-body' },
    page
      ? createElement('article', { className: 'website-page website-section' },
          createElement('div', { className: 'website-eyebrow' }, language === 'bn' ? 'তথ্য' : 'Information'),
          createElement('h1', null, get_localized_value(page.page_title, language)),
          createElement('div', { className: 'website-rich-content', dangerouslySetInnerHTML: { __html: sanitize_html(page.html_content ?? '') } })
        )
      : createElement('section', { className: 'website-page-not-found website-section' },
          createElement('h1', null, get_localized_value({ bn: 'পেজ পাওয়া যায়নি', en: 'Page not found' }, language)),
          createElement('p', null, language === 'bn' ? 'ঠিকানাটি পরীক্ষা করে আবার চেষ্টা করুন।' : 'Please check the address and try again.')
        )
  )
}

function render_website(state, language, pathname, language_control, theme_control) {
  const information = get_information_map(state.information)
  const website_name = get_information_value(information, 'website_name', language)
  const village_name = get_information_value(information, 'village_name', language)
  const village_slogan = get_information_value(information, 'village_slogan', language)
  const is_home = pathname === '/' || pathname === ''

  return createElement(website_layout, {
    profile: state.admin_information,
    managed_links: state.links,
    navigation_items: state.pages.filter((page) => page.page_slug),
    language,
    header: createElement(header, {
      site_title: website_name || village_name,
      site_tagline: village_slogan,
      logo_url: get_information_value(information, 'website_logo', language),
      language_control,
      theme_control,
      search_control: createElement(public_search, { information: state.information, pages: state.pages, posts: state.posts, language })
    }),
    banner: is_home ? createElement(banner, { title: village_name || website_name, description: village_slogan, media_url: get_information_value(information, 'home_banner_media_url', language) }) : null,
    body: is_home ? render_home_page(state, language) : render_dynamic_page(state, language, pathname),
    footer: createElement(footer, { copyright: get_information_value(information, 'footer_copyright', language) })
  })
}

export function public_page() {
  const [state, set_state] = useState(empty_state)
  const [language, set_language] = useState(get_saved_language())
  const [theme_mode, set_theme_mode] = useState(get_theme_mode())
  const location = useLocation()

  useEffect(() => { document.documentElement.lang = language }, [language])
  useEffect(() => { apply_theme_mode(theme_mode) }, [theme_mode])
  useEffect(() => subscribe_to_system_theme(set_theme_mode), [])

  useEffect(() => {
    let active = true
    record_visit()

    Promise.all([
      get_website_information(),
      get_public_links(),
      get_admin_information(),
      get_public_pages(),
      get_public_posts(),
      get_public_customization(),
      get_public_seo_settings()
    ]).then(([information, links, admin_information, pages, posts, customization, seo_settings]) => {
      if (!active) return

      apply_customization(customization)
      apply_theme_settings(customization)

      const slug = location.pathname.replace(/^\/+|\/+$/g, '')
      const page = pages.find((item) => item.page_slug === slug && item.page_slug)
      const map = get_information_map(information)
      const website_name = get_information_value(map, 'website_name', language)
      const village_name = get_information_value(map, 'village_name', language)
      const village_slogan = get_information_value(map, 'village_slogan', language)
      const global_seo = seo_settings.find((item) => item.entity_type === 'website' && !item.entity_id)
      const page_seo = page ? seo_settings.find((item) => item.entity_type === 'page' && item.entity_id === page.page_id) : null
      const seo = page_seo ?? global_seo ?? page?.seo_data ?? {}

      apply_seo({
        title: seo.title?.[language] ?? seo.title?.bn ?? page?.page_title?.[language] ?? page?.page_title?.bn ?? website_name ?? village_name,
        description: seo.description?.[language] ?? seo.description?.bn ?? village_slogan,
        canonical_url: seo.canonical_url ?? window.location.href
      })

      set_state({ loading: false, error: null, information, links, admin_information, pages, posts, customization, seo_settings })
    }).catch((error) => {
      console.error(error)
      if (active) set_state({ ...empty_state, loading: false, error })
    })

    return () => { active = false }
  }, [language, location.pathname])

  const change_language = (next_language) => set_language(save_language(next_language))
  const toggle_theme = () => set_theme_mode(set_manual_theme_mode(theme_mode === 'dark' ? 'light' : 'dark'))

  const language_control = createElement('button', {
    type: 'button',
    className: 'website-header-control',
    onClick: () => change_language(language === 'bn' ? 'en' : 'bn')
  }, language === 'bn' ? 'EN' : 'বাংলা')

  const theme_control = createElement('button', {
    type: 'button',
    className: 'website-header-control',
    onClick: toggle_theme,
    'aria-label': 'Toggle theme'
  }, theme_mode === 'dark' ? '☀' : '☾')

  if (state.loading) return createElement(website_skeleton)

  if (state.error) {
    return createElement('main', { className: 'website-error-page' },
      createElement('section', { className: 'website-section' },
        createElement('h1', null, language === 'bn' ? 'তথ্য লোড করা যায়নি' : 'Could not load the website'),
        createElement('p', null, language === 'bn' ? 'কিছুক্ষণ পর আবার চেষ্টা করুন।' : 'Please try again shortly.')
      )
    )
  }

  return render_website(state, language, location.pathname, language_control, theme_control)
}
