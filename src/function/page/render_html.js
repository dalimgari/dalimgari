export function sanitize_html(html = '') {
  const template = document.createElement('template')
  template.innerHTML = html
  template.content.querySelectorAll('script, iframe, object, embed, form').forEach((element) => element.remove())
  template.content.querySelectorAll('*').forEach((element) => {
    [...element.attributes].forEach((attribute) => {
      if (attribute.name.toLowerCase().startsWith('on')) element.removeAttribute(attribute.name)
      if ((attribute.name === 'href' || attribute.name === 'src') && /^javascript:/i.test(attribute.value)) element.removeAttribute(attribute.name)
    })
  })
  return template.innerHTML
}

export function render_page_html(html = '') {
  return { __html: sanitize_html(html) }
}
