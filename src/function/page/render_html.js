export function sanitize_html(html = '') {
  if (!html) return ''
  const template = document.createElement('template')
  template.innerHTML = String(html)
  template.content.querySelectorAll('script, iframe, object, embed, form, style, link, meta').forEach((element) => element.remove())
  template.content.querySelectorAll('*').forEach((element) => {
    [...element.attributes].forEach((attribute) => {
      const name = attribute.name.toLowerCase()
      if (name.startsWith('on')) element.removeAttribute(attribute.name)
      if (['href', 'src', 'action'].includes(name) && /^(javascript:|data:text\/html)/i.test(attribute.value.trim())) {
        element.removeAttribute(attribute.name)
      }
    })
  })
  return template.innerHTML
}

export function render_page_html(html = '') {
  return { __html: sanitize_html(html) }
}
