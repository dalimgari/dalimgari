const translationCache = new Map()
const pendingTranslations = new Map()
const translatedNodes = new WeakMap()
const translatedAttributes = new WeakMap()

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

function shouldSkipElement(element) {
  if (!element || element.nodeType !== Node.ELEMENT_NODE) return true
  return Boolean(
    element.closest('[data-language-switch]') ||
    element.closest('script,style,noscript,code,pre,textarea') ||
    element.hasAttribute('data-no-translate')
  )
}

function shouldSkipTextNode(node) {
  if (!node?.parentElement) return true
  if (shouldSkipElement(node.parentElement)) return true
  const text = normalize(node.nodeValue)
  return !text || /^[\d\s.,:;!?+\-/%()#[\]{}@_]+$/.test(text)
}

function getTextNodes(root) {
  const nodes = []
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  let node = walker.nextNode()
  while (node) {
    if (!shouldSkipTextNode(node)) nodes.push(node)
    node = walker.nextNode()
  }
  return nodes
}

async function translateNode(node) {
  if (shouldSkipTextNode(node)) return
  const current = normalize(node.nodeValue)
  if (!current) return

  const previous = translatedNodes.get(node)
  if (previous && previous.translated === current) return

  const source = previous && previous.source !== current ? current : (previous?.source || current)
  const translated = await translateText(source, 'bn', 'en')
  if (normalize(node.nodeValue) !== source) return

  translatedNodes.set(node, { source, translated })
  node.nodeValue = translated
}

async function translateElementAttributes(element) {
  if (shouldSkipElement(element)) return
  const attributes = ['placeholder', 'title', 'aria-label', 'alt']
  for (const name of attributes) {
    if (!element.hasAttribute(name)) continue
    const current = normalize(element.getAttribute(name))
    if (!current) continue

    let record = translatedAttributes.get(element)
    if (!record) {
      record = new Map()
      translatedAttributes.set(element, record)
    }

    const previous = record.get(name)
    if (previous?.translated === current) continue

    const source = previous?.source && previous.translated !== current ? current : (previous?.source || current)
    const translated = await translateText(source, 'bn', 'en')
    if (normalize(element.getAttribute(name)) !== source) continue

    record.set(name, { source, translated })
    element.setAttribute(name, translated)
  }
}

async function translateDocument(root = document.body) {
  if (!root) return
  const nodes = getTextNodes(root)
  const elements = [root, ...root.querySelectorAll?.('*') || []]
  const uniqueElements = elements.filter((element) => !shouldSkipElement(element))

  for (let index = 0; index < nodes.length; index += 6) {
    await Promise.all(nodes.slice(index, index + 6).map(translateNode))
  }
  for (let index = 0; index < uniqueElements.length; index += 6) {
    await Promise.all(uniqueElements.slice(index, index + 6).map(translateElementAttributes))
  }

  if (root === document.body) {
    const title = normalize(document.title)
    if (title && !document.title.__dalimgariTranslated) {
      const translated = await translateText(title, 'bn', 'en')
      document.title = translated
    }
  }
}

function restoreDocument(root = document.body) {
  if (!root) return

  getTextNodes(root).forEach((node) => {
    const record = translatedNodes.get(node)
    if (record && normalize(node.nodeValue) === record.translated) node.nodeValue = record.source
  })

  const elements = [root, ...root.querySelectorAll?.('*') || []]
  elements.forEach((element) => {
    const record = translatedAttributes.get(element)
    if (!record) return
    record.forEach(({ source, translated }, name) => {
      if (normalize(element.getAttribute(name)) === translated) element.setAttribute(name, source)
    })
  })
}

export function applyLanguageToDocument(language = 'bng') {
  if (typeof document === 'undefined') return Promise.resolve()
  const isEnglish = language === 'eng'
  document.documentElement.lang = isEnglish ? 'en' : 'bn'
  if (!isEnglish) {
    restoreDocument(document.body)
    return Promise.resolve()
  }
  return translateDocument(document.body)
}

export function observeLanguageDocument(language = 'bng') {
  if (typeof document === 'undefined') return () => {}
  let active = true
  const observer = new MutationObserver((mutations) => {
    if (!active || language !== 'eng') return
    const textNodes = []
    const elements = []

    mutations.forEach((mutation) => {
      if (mutation.type === 'characterData') {
        const record = translatedNodes.get(mutation.target)
        if (!record || normalize(mutation.target.nodeValue) !== record.translated) textNodes.push(mutation.target)
        return
      }
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.TEXT_NODE) textNodes.push(node)
        else if (node.nodeType === Node.ELEMENT_NODE) {
          getTextNodes(node).forEach((item) => textNodes.push(item))
          elements.push(node, ...node.querySelectorAll('*'))
        }
      })
      if (mutation.type === 'attributes' && mutation.target.nodeType === Node.ELEMENT_NODE) {
        elements.push(mutation.target)
      }
    })

    const uniqueTextNodes = [...new Set(textNodes)]
    const uniqueElements = [...new Set(elements)]
    Promise.all(uniqueTextNodes.map(translateNode))
    Promise.all(uniqueElements.map(translateElementAttributes))
  })

  document.documentElement.lang = language === 'eng' ? 'en' : 'bn'
  observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['placeholder', 'title', 'aria-label', 'alt'] })

  if (language === 'eng') translateDocument(document.body)

  return () => {
    active = false
    observer.disconnect()
    if (language === 'eng') restoreDocument(document.body)
    document.documentElement.lang = 'bn'
  }
}
