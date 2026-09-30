import { createElement, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { website_layout } from '../../layout/website/website_layout'
import { header } from '../../component/navigation/header'
import { banner } from '../../component/common/banner'
import { footer } from '../../component/common/footer'
import { page_navigation } from '../../component/navigation/page_navigation'
import { post_list } from '../../component/post/post_list'
import { website_skeleton } from '../../component/common/website_skeleton'
import { get_website_information, get_admin_information, get_public_pages, get_public_posts, get_public_customization } from '../../service/supabase/website_service.js'
import { apply_customization } from '../../function/customization/apply_customization'
import { record_visit } from '../../function/analytics/record_visit'
import { apply_seo } from '../../function/seo/apply_seo'
import { get_localized_value } from '../../function/translation/language'

const empty_state = {
  loading: true,
  error: null,
  information: [],
  admin: null,
  pages: [],
  posts: [],
  customization: []
}

function get_information_map(information) {
  return information.reduce((result, item) => {
    result[item.information_key] = item.information_value ?? ''
    return result
  }, {})
}

function get_information_value(information_map, key, language = 'bn') {
  const value = information_map[key]
  if (value && typeof value === 'object') {
    return value[language] ?? value.bn ?? value.en ?? ''
  }
  return value ?? ''
}

function render_home_page(state, language) {
  const information = get_information_map(state.information)
  const website_name = get_information_value(information, 'website_name', language)
  const village_name = get_information_value(information, 'village_name', language)
  const village_slogan = get_information_value(information, 'village_slogan', language)
  const village_description = get_information_value(information, 'village_description', language)
  const district = get_information_value(information, 'district', language)
  const upazila = get_information_value(information, 'upazila', language)
  const union = get_information_value(information, 'union', language)
  const post_office = get_information_value(information, 'post_office', language)
  const postal_code = get_information_value(information, 'postal_code', language)
  const contact_phone = get_information_value(information, 'contact_phone', language)
  const contact_email = get_information_value(information, 'contact_email', language)
  const facebook_link = get_information_value(information, 'facebook_link', language)
  const youtube_link = get_information_value(information, 'youtube_link', language)
  const other_social_links = get_information_value(information, 'other_social_links', language)

  const address_parts = [village_name, union, upazila, district, post_office, postal_code].filter(Boolean)
  const admin_profile = {
    display_name: get_information_value(information, 'admin_name', language),
    email: get_information_value(information, 'admin_email', language),
    phone: get_information_value(information, 'admin_phone', language),
    profile_image_url: get_information_value(information, 'admin_profile_image', language),
    social_links: {
      links: [
        facebook_link && { label: 'Facebook', url: facebook_link },
        youtube_link && { label: 'YouTube', url: youtube_link },
        other_social_links && { label: 'Social', url: other_social_links }
      ].filter(Boolean)
    }
  }

  return createElement(
    'main',
    { className: 'website-body' },
    createElement(
      'section',
      { className: 'home-introduction' },
      createElement('h2', null, village_name || website_name),
      village_slogan && createElement('p', null, village_slogan),
      village_description && createElement('p', null, village_description)
    ),
    createElement(page_navigation, { pages: state.pages.filter((page) => page.page_slug), language }),
    address_parts.length > 0 && createElement(
      'section',
      { className: 'home-contact' },
      createElement('h2', null, website_name || village_name),
      createElement('p', null, address_parts.join(', ')),
      contact_phone && createElement('p', null, contact_phone),
      contact_email && createElement('p', null, contact_email)
    ),
    createElement(post_list, { posts: state.posts, language })
  )
}

function render_dynamic_page(state, language, pathname) {
  const page_slug = pathname.replace(/^\/+|\/+$/g, '')
  const page = state.pages.find((item) => item.page_slug === page_slug && item.page_slug)

  return createElement(
    'main',
    { className: 'website-body' },
    page
      ? createElement('article', {
          className: 'website-page',
          dangerouslySetInnerHTML: { __html: page.html_content ?? '' }
        })
      : createElement(
          'section',
          { className: 'website-page-not-found' },
          createElement('h1', null, get_localized_value({ bn: 'পেজ পাওয়া যায়নি', en: 'Page not found' }, language))
        )
  )
}

function render_website(state, language, pathname) {
  const information = get_information_map(state.information)
  const website_name = get_information_value(information, 'website_name', language)
  const village_name = get_information_value(information, 'village_name', language)
  const village_slogan = get_information_value(information, 'village_slogan', language)
  const banner_data = {
    title: village_name || website_name,
    description: village_slogan,
    media_url: get_information_value(information, 'home_banner_media_url', language)
  }

  const is_home = pathname === '/' || pathname === ''
  const body = is_home
    ? render_home_page(state, language)
    : render_dynamic_page(state, language, pathname)

  const admin_profile = {
    display_name: get_information_value(information, 'admin_name', language),
    email: get_information_value(information, 'admin_email', language),
    phone: get_information_value(information, 'admin_phone', language),
    profile_image_url: get_information_value(information, 'admin_profile_image', language),
    social_links: { links: [] }
  }

  return createElement(website_layout, {
    profile: admin_profile,
    navigation_items: state.pages.filter((page) => page.page_slug),
    language,
    header: createElement(header, { site_title: website_name || village_name }),
    banner: is_home ? createElement(banner, banner_data) : null,
    body,
    footer: createElement(footer)
  })
}

export function public_page() {
  const [state, set_state] = useState(empty_state)
  const location = useLocation()
  const language = localStorage.getItem('language') || 'bn'

  useEffect(() => {
    let active = true
    record_visit()

    Promise.all([
      get_website_information(),
      get_admin_information(),
      get_public_pages(),
      get_public_posts(),
      get_public_customization()
    ])
      .then(([information, admin, pages, posts, customization]) => {
        if (!active) return

        apply_customization(customization)

        const page_slug = location.pathname.replace(/^\/+|\/+$/g, '')
        const page = pages.find((item) => item.page_slug === page_slug && item.page_slug)
        const seo = page?.seo_data ?? information.find((item) => item.information_key === 'seo')?.information_value ?? {}

        const information_map = get_information_map(information)
        const website_name = get_information_value(information_map, 'website_name', language)
        const village_name = get_information_value(information_map, 'village_name', language)
        const village_slogan = get_information_value(information_map, 'village_slogan', language)
        const seo_title = seo.title?.[language] ?? seo.title?.bn ?? page?.page_title?.[language] ?? page?.page_title?.bn ?? website_name ?? village_name
        const seo_description = seo.description?.[language] ?? seo.description?.bn ?? village_slogan

        apply_seo({
          title: seo_title,
          description: seo_description,
          canonical_url: seo.canonical_url ?? window.location.href
        })

        set_state({
          loading: false,
          error: null,
          information,
          admin,
          pages,
          posts,
          customization
        })
      })
      .catch((error) => {
        if (!active) return
        set_state({ ...empty_state, loading: false, error })
      })

    return () => {
      active = false
    }
  }, [language, location.pathname])

  if (state.loading) return createElement(website_skeleton)
  return render_website(state, language, location.pathname)
}
