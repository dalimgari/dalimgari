const PUBLIC_ROUTES = ['/', '/posts', '/albums', '/information', '/login', '/signup']
const MAX_DISCOVERED_ROUTES = 24
const ROUTE_TIMEOUT_MS = 8000

function appUrl(route) {
  const base = import.meta.env.BASE_URL || '/'
  const normalizedBase = base.endsWith('/') ? base : base + '/'
  const normalizedRoute = route === '/' ? '' : route.replace(/^\//, '')
  return new URL(normalizedRoute, new URL(normalizedBase, window.location.origin)).href
}

function statusCheck(key, label, status, detail, category = 'Website') {
  return { key, label, status, detail, category }
}

function waitForFrame(frame, timeout = ROUTE_TIMEOUT_MS) {
  return new Promise((resolve) => {
    let settled = false
    const finish = (result) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      frame.removeEventListener('load', onLoad)
      resolve(result)
    }
    const onLoad = () => finish({ loaded: true })
    const timer = setTimeout(() => finish({ loaded: false }), timeout)
    frame.addEventListener('load', onLoad, { once: true })
  })
}

function hasAccessibleName(element) {
  return Boolean(element.getAttribute('aria-label') || element.getAttribute('title') || element.textContent?.trim() || element.querySelector('svg[aria-label], img[alt]'))
}

function inspectDocument(doc, route) {
  const checks = []
  const title = doc.title?.trim()
  checks.push(statusCheck('title-' + route, 'পেজের Title', title ? 'passed' : 'warning', title ? 'Title পাওয়া গেছে।' : 'এই পেজে document title পাওয়া যায়নি.', 'Accessibility'))

  const viewport = doc.querySelector('meta[name="viewport"]')
  checks.push(statusCheck('viewport-' + route, 'Responsive viewport', viewport ? 'passed' : 'warning', viewport ? 'Viewport meta tag আছে।' : 'Viewport meta tag পাওয়া যায়নি.', 'Responsive'))

  const h1s = doc.querySelectorAll('h1')
  checks.push(statusCheck('heading-' + route, 'Heading structure', h1s.length === 1 ? 'passed' : 'warning', h1s.length === 1 ? 'একটি H1 পাওয়া গেছে।' : (h1s.length ? h1s.length + 'টি H1 পাওয়া গেছে।' : 'H1 পাওয়া যায়নি।'), 'Accessibility'))

  const images = [...doc.images]
  const brokenImages = images.filter((image) => image.complete && image.naturalWidth === 0)
  const missingAlt = images.filter((image) => !image.hasAttribute('alt'))
  checks.push(statusCheck('images-broken-' + route, 'Broken images', brokenImages.length ? 'failed' : 'passed', brokenImages.length ? brokenImages.length + 'টি image load হয়নি।' : (images.length ? images.length + 'টি image পরীক্ষা করা হয়েছে।' : 'Image পাওয়া যায়নি।'), 'Assets'))
  if (missingAlt.length) checks.push(statusCheck('images-alt-' + route, 'Image alt text', 'warning', missingAlt.length + 'টি image-এ alt attribute নেই।', 'Accessibility'))
  else if (images.length) checks.push(statusCheck('images-alt-' + route, 'Image alt text', 'passed', 'সব image-এ alt attribute আছে।', 'Accessibility'))

  const buttons = [...doc.querySelectorAll('button, [role="button"]')]
  const unnamedButtons = buttons.filter((button) => !hasAccessibleName(button))
  checks.push(statusCheck('buttons-' + route, 'Button accessibility', unnamedButtons.length ? 'warning' : 'passed', unnamedButtons.length ? unnamedButtons.length + 'টি button-এর accessible name নেই।' : 'সব button-এর accessible name আছে।', 'Accessibility'))

  const formControls = [...doc.querySelectorAll('input, select, textarea')].filter((el) => el.type !== 'hidden')
  const unlabeledControls = formControls.filter((control) => {
    if (control.getAttribute('aria-label') || control.getAttribute('aria-labelledby')) return false
    if (control.id && doc.querySelector('label[for="' + CSS.escape(control.id) + '"]')) return false
    return !control.closest('label')
  })
  if (unlabeledControls.length) checks.push(statusCheck('forms-' + route, 'Form labels', 'warning', unlabeledControls.length + 'টি form control-এর label নেই।', 'Accessibility'))
  else if (formControls.length) checks.push(statusCheck('forms-' + route, 'Form labels', 'passed', 'সব visible form control-এর label/ARIA name আছে।', 'Accessibility'))

  const duplicateIds = new Set()
  const seenIds = new Set()
  doc.querySelectorAll('[id]').forEach((el) => {
    if (seenIds.has(el.id)) duplicateIds.add(el.id)
    seenIds.add(el.id)
  })
  checks.push(statusCheck('duplicate-ids-' + route, 'Duplicate IDs', duplicateIds.size ? 'warning' : 'passed', duplicateIds.size ? duplicateIds.size + 'টি duplicate ID পাওয়া গেছে।' : 'Duplicate ID পাওয়া যায়নি।', 'HTML'))

  const insecureResources = [...doc.querySelectorAll('img[src], script[src], link[href], iframe[src], video[src], audio[src]')]
    .map((el) => el.src || el.href)
    .filter((url) => /^http:\/\//i.test(url))
  checks.push(statusCheck('mixed-content-' + route, 'HTTPS / mixed content', insecureResources.length ? 'failed' : 'passed', insecureResources.length ? insecureResources.length + 'টি HTTP resource পাওয়া গেছে।' : 'HTTP mixed-content resource পাওয়া যায়নি।', 'Security'))

  const links = [...doc.querySelectorAll('a[href]')]
  const unsafeLinks = links.filter((link) => /^(javascript:|data:|vbscript:)/i.test(link.getAttribute('href') || ''))
  checks.push(statusCheck('links-' + route, 'Unsafe links', unsafeLinks.length ? 'failed' : 'passed', unsafeLinks.length ? unsafeLinks.length + 'টি unsafe link পাওয়া গেছে।' : 'Unsafe javascript/data/vbscript link পাওয়া যায়নি।', 'Security'))

  const internalRoutes = links.map((link) => {
    try {
      const url = new URL(link.href, window.location.href)
      if (url.origin !== window.location.origin) return null
      const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '')
      let path = url.pathname.startsWith(base) ? url.pathname.slice(base.length) : url.pathname
      path = path.replace(/\/$/, '') || '/'
      if (/^\/(manage|dashboard|admin)/.test(path)) return null
      return path
    } catch { return null }
  }).filter(Boolean)

  return { checks, internalRoutes }
}

async function scanRoute(route) {
  const frame = document.createElement('iframe')
  frame.setAttribute('title', 'Website security scan: ' + route)
  frame.style.cssText = 'position:fixed;left:-10000px;top:-10000px;width:1280px;height:900px;opacity:0;pointer-events:none;border:0;'
  frame.src = appUrl(route)
  document.body.appendChild(frame)
  const loaded = await waitForFrame(frame)
  if (!loaded.loaded) {
    frame.remove()
    return { checks: [statusCheck('route-' + route, 'Page load', 'failed', route + ' নির্ধারিত সময়ে load হয়নি।', 'Availability')], internalRoutes: [] }
  }
  await new Promise((resolve) => setTimeout(resolve, 700))
  try {
    const result = inspectDocument(frame.contentDocument, route)
    frame.remove()
    return result
  } catch (error) {
    frame.remove()
    return { checks: [statusCheck('route-' + route, 'Page scan', 'failed', route + ' scan করা যায়নি: ' + (error?.message || 'অজানা সমস্যা'), 'Availability')], internalRoutes: [] }
  }
}

async function checkSiteResponse() {
  try {
    const response = await fetch(appUrl('/'), { method: 'GET', cache: 'no-store' })
    return statusCheck('http-home', 'Website root response', response.ok ? 'passed' : 'failed', response.ok ? 'Website root HTTP ' + response.status + ' response দিয়েছে।' : 'Website root HTTP ' + response.status + ' response দিয়েছে।', 'Availability')
  } catch (error) {
    return statusCheck('http-home', 'Website root response', 'failed', 'Website root request ব্যর্থ: ' + (error?.message || 'অজানা সমস্যা'), 'Availability')
  }
}

export async function runWebsiteScan() {
  const started = performance.now()
  const routes = new Set(PUBLIC_ROUTES)
  const checks = []

  checks.push(statusCheck('site-https', 'Website HTTPS', window.location.protocol === 'https:' || window.location.hostname === 'localhost' ? 'passed' : 'failed', window.location.protocol === 'https:' ? 'Website HTTPS-এ চলছে।' : 'সাইট HTTPS-এ চলছে না।', 'Security'))

  const initialRoutes = [...routes]
  for (const route of initialRoutes) {
    const result = await scanRoute(route)
    checks.push(...result.checks)
    for (const discovered of result.internalRoutes) {
      if (routes.size >= MAX_DISCOVERED_ROUTES) break
      routes.add(discovered)
    }
  }

  const discovered = [...routes].filter((route) => !initialRoutes.includes(route)).slice(0, MAX_DISCOVERED_ROUTES - initialRoutes.length)
  for (const route of discovered) {
    const result = await scanRoute(route)
    checks.push(...result.checks)
  }

  checks.push(await checkSiteResponse())

  const summary = checks.reduce((acc, check) => {
    acc[check.status] = (acc[check.status] || 0) + 1
    return acc
  }, { passed: 0, warning: 0, failed: 0 })
  const status = summary.failed ? 'failed' : summary.warning ? 'warning' : 'passed'

  return { status, summary, checks, scannedRoutes: [...routes], durationMs: Math.round(performance.now() - started), completed_at: new Date().toISOString() }
}
