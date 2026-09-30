import { createElement } from 'react'
import { website_layout } from '../../layout/website/website_layout'
import { header } from '../../component/navigation/header'
import { banner } from '../../component/common/banner'
import { footer } from '../../component/common/footer'
import { page_navigation } from '../../component/navigation/page_navigation'

export function public_page({ website_title = '', banner_data = {}, pages = [], profile = null, navigation_items = [], body = null }) {
  return createElement(
    website_layout,
    {
      profile,
      navigation_items,
      header: createElement(header, { site_title: website_title }),
      banner: createElement(banner, banner_data),
      body: createElement('main', { className: 'website-body' }, createElement(page_navigation, { pages }), body),
      footer: createElement(footer)
    }
  )
}
