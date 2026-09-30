import { createElement, useEffect, useState } from 'react'
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

function render_website(state, language) {
  const site_title = state.information.find((item) => item.information_key === 'site_title')?.information_value?.[language] ?? 'ডালিমগাড়ী'
  const banner_data = state.information.find((item) => item.information_key === 'home_banner')?.information_value ?? {}

  return createElement(website_layout, {
    profile: state.admin?.information_value ?? state.admin?.profiles ?? null,
    navigation_items: state.pages,
    header: createElement(header, { site_title }),
    banner: createElement(banner, banner_data),
    body: createElement('main', { className: 'website-body' },
      createElement(page_navigation, { pages: state.pages, language }),
      createElement(post_list, { posts: state.posts, language })
    ),
    footer: createElement(footer)
  })
}

export function public_page() {
  const [state, set_state] = useState(empty_state)
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
        const seo = information.find((item) => item.information_key === 'seo')?.information_value ?? {}
        apply_seo({
          title: seo.title?.[language] ?? seo.title?.bn ?? 'ডালিমগাড়ী',
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
  }, [language])

  if (state.loading) return createElement(website_skeleton)
  return render_website(state, language)
}
