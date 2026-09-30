const language_storage_key = 'website_language'

export function get_saved_language() {
  return localStorage.getItem(language_storage_key) || 'bn'
}

export function save_language(language) {
  const selected_language = language === 'en' ? 'en' : 'bn'
  localStorage.setItem(language_storage_key, selected_language)
  document.documentElement.lang = selected_language
  return selected_language
}
