// Translation is explicit only. There is no automatic source-language detection or DOM-wide translation.

const translationCache = new Map()
const pendingTranslations = new Map()

function normalize(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim()
}

function cacheKey(text, source, target) {
  return `${source}:${target}:${text}`
}

export async function translateText(value, source, target) {
  const text = normalize(value)
  if (!text || !source || !target || source === target) return text
  const key = cacheKey(text, source, target)
  if (translationCache.has(key)) return translationCache.get(key)
  if (pendingTranslations.has(key)) return pendingTranslations.get(key)

  const promise = fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=${encodeURIComponent(source)}&tl=${encodeURIComponent(target)}&dt=t&q=${encodeURIComponent(text)}`)
    .then((response) => response.ok ? response.json() : null)
    .then((data) => {
      const translated = Array.isArray(data?.[0]) ? data[0].map((part) => part?.[0] || '').join('') : ''
      const result = normalize(translated) || text
      translationCache.set(key, result)
      return result
    })
    .catch(() => text)
    .finally(() => pendingTranslations.delete(key))

  pendingTranslations.set(key, promise)
  return promise
}

// Kept as compatibility no-ops for any legacy caller; language switching is disabled.
export function applyLanguageToDocument() {
  if (typeof document !== 'undefined') document.documentElement.lang = 'bn'
}

export function observeLanguageDocument() {
  if (typeof document !== 'undefined') document.documentElement.lang = 'bn'
  return () => {}
}
