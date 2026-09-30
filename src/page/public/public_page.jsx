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

const empty_state = { loading: true, error: null, information: [], admin: null, pages: [], posts: [], customization: [] }

function render_website(state, language, pathname) {
  const site_title = state.information.find((item) => item.information_key === 'site_title')?.information_value?.[language] ?? ''
  const banner_data = state.information.find((item) => item.information_key === 'home_banner')?.information_value ?? {}
  const page_slug = pathname.replace(/^\/+|\/+$/g, '')
  const page = page_slug ? state.pages.find((item) => item.page_slug === page_slug) : null
  const page_title = page ? page.page_title?.[language] ?? page.page_title?.bn ?? page.page_title?.en ?? '' : ''
  const is_home = !page_slug

  const body = is_home
    ? createElement('main', { className: 'website-body' },
        createElement(page_navigation, { pages: state.pages, language }),
        createElement(post_list, { posts: state.posts, language })
      )
    : createElement('main', { className: 'website-body' },
        page
          ? createElement('article', {
              className: 'website-page',
              dangerouslySetInnerHTML: { __html: page.html_content ?? '' }
            })
          : null
      )

  return createElement(website_layout, {
    profile: state.admin?.information_value ?? state.admin?.profiles ?? null,
    navigation_items: state.pages,
    header: createElement(header, { site_title }),
    banner: is_home ? createElement(banner, banner_data) : null,
    body
  , footer: createElement(footer) })
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
        const page = pages.find((item) => item.page_slug === page_slug)
        const seo = page?.seo_data ?? information.find((item) => item.information_key === 'seo')?.information_value ?? {}
        apply_seo({
          title: seo.title?.[language] ?? seo.title?.bn ?? page?.page_title?.[language] ?? page?.page_title?.bn ?? '',
          description: seo.description?.[language] ?? seo.description?.bn ?? '',
          canonical_url: seo.canonical_url ?? window.location.href
        })
        set_state({ loading: false, error: null, information, admin, pages, posts, customization })
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
