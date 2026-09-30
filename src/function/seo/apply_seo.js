export function apply_seo({ title = '', description = '', canonical_url = '' } = {}) {
  document.title = title
  const description_element = document.querySelector('meta[name="description"]')
  if (description_element) description_element.setAttribute('content', description)

  let canonical_element = document.querySelector('link[rel="canonical"]')
  if (!canonical_element) {
    canonical_element = document.createElement('link')
    canonical_element.rel = 'canonical'
    document.head.appendChild(canonical_element)
  }
  if (canonical_url) canonical_element.href = canonical_url
}
