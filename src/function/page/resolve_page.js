import { get_localized_value } from '../translation/language'
import { sanitize_html } from './render_html'

export function resolve_page(page, language = 'bn') {
  if (!page) return null
  return {
    id: page.page_id,
    key: page.page_key,
    title: get_localized_value(page.page_title, language),
    slug: page.page_slug,
    html: sanitize_html(page.html_content),
    seo: page.seo_data ?? {}
  }
}
