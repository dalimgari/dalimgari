import { getHomepageSettings } from '../services/homepageService'

const DEFAULT_AUTO_SCROLL_INTERVAL = 4000
const DEFAULT_SCROLL_DURATION = 650
const DEFAULT_USER_PAUSE_DURATION = 60000

const clamp = (value, min, max, fallback) => {
  const n = Number(value)
  return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : fallback
}

const isHorizontalScroller = (element) => {
  if (!(element instanceof HTMLElement)) return false
  if (element.scrollWidth <= element.clientWidth + 2) return false
  const overflowX = getComputedStyle(element).overflowX
  return overflowX === 'auto' || overflowX === 'scroll'
}

const getNextScrollPosition = (element, infiniteLoop) => {
  const current = element.scrollLeft
  const children = Array.from(element.children).filter((child) => child instanceof HTMLElement)
  const next = children.find((child) => child.offsetLeft > current + 8)
  if (next) return Math.min(next.offsetLeft, element.scrollWidth - element.clientWidth)
  return infiniteLoop ? 0 : Math.max(0, element.scrollWidth - element.clientWidth)
}

const easing = (progress, type) => {
  if (type === 'linear') return progress
  if (type === 'clock') return 1 - Math.cos((progress * Math.PI) / 2)
  if (type === 'circle') return 1 - Math.sqrt(1 - Math.min(1, progress) ** 2)
  return progress * progress * (3 - 2 * progress)
}

const animateScroll = (element, target, duration, type) => {
  if (target === element.scrollLeft) return
  if (duration <= 0 || type === 'instant') {
    element.scrollLeft = target
    return
  }

  const start = element.scrollLeft
  const distance = target - start
  const startedAt = performance.now()

  const frame = (now) => {
    const progress = Math.min(1, (now - startedAt) / duration)
    element.scrollLeft = start + distance * easing(progress, type)
    if (progress < 1) window.requestAnimationFrame(frame)
  }

  window.requestAnimationFrame(frame)
}

const advanceScroller = (element, options = {}) => {
  if (!isHorizontalScroller(element)) return
  const { duration = DEFAULT_SCROLL_DURATION, scrollType = 'smooth', infiniteLoop = true } = options
  const nextPosition = getNextScrollPosition(element, infiniteLoop)
  animateScroll(element, nextPosition, duration, scrollType)
}

const findScroller = (target, scrollers) => {
  let element = target instanceof Element ? target : null
  while (element) {
    if (scrollers.has(element)) return element
    element = element.parentElement
  }
  return null
}

const initHorizontalAutoScroll = async () => {
  const scrollers = new Set()
  const timers = new Map()
  const pauseTimers = new Map()
  let interval = DEFAULT_AUTO_SCROLL_INTERVAL
  let duration = DEFAULT_SCROLL_DURATION
  let pauseDuration = DEFAULT_USER_PAUSE_DURATION
  let scrollType = 'smooth'
  let infiniteLoop = true
  let enabled = true

  try {
    const settings = await getHomepageSettings()
    const config = settings?.horizontalAutoScroll || {}
    enabled = config.enabled !== false
    interval = clamp(config.intervalMs, 1000, 60000, DEFAULT_AUTO_SCROLL_INTERVAL)
    duration = clamp(config.durationMs, 0, 10000, DEFAULT_SCROLL_DURATION)
    pauseDuration = clamp(config.pauseAfterInteractionMs, 10000, 300000, DEFAULT_USER_PAUSE_DURATION)
    scrollType = ['instant', 'linear', 'smooth', 'clock', 'circle'].includes(config.scrollType) ? config.scrollType : 'smooth'
    infiniteLoop = config.infiniteLoop !== false
  } catch {
    // Keep safe defaults if DB settings cannot be read.
  }

  const stopTimer = (element) => {
    const timer = timers.get(element)
    if (timer) window.clearInterval(timer)
    timers.delete(element)
  }

  const schedule = (element) => {
    if (!enabled || !isHorizontalScroller(element) || timers.has(element)) return
    timers.set(element, window.setInterval(() => advanceScroller(element, { duration, scrollType, infiniteLoop }), interval))
  }

  const pause = (element) => {
    stopTimer(element)
    const previous = pauseTimers.get(element)
    if (previous) window.clearTimeout(previous)
    pauseTimers.set(element, window.setTimeout(() => {
      pauseTimers.delete(element)
      schedule(element)
    }, pauseDuration))
  }

  const scan = () => {
    document.querySelectorAll('*').forEach((element) => {
      if (!isHorizontalScroller(element)) return
      scrollers.add(element)
      schedule(element)
    })
  }

  const handleInteraction = (event) => {
    const element = findScroller(event.target, scrollers)
    if (element) pause(element)
  }

  document.addEventListener('pointerdown', handleInteraction, { passive: true })
  document.addEventListener('pointermove', handleInteraction, { passive: true })
  document.addEventListener('touchstart', handleInteraction, { passive: true })
  document.addEventListener('wheel', handleInteraction, { passive: true })

  scan()
  const observer = new MutationObserver(scan)
  observer.observe(document.body, { childList: true, subtree: true })
}

if (typeof window !== 'undefined') {
  window.addEventListener('load', initHorizontalAutoScroll, { once: true })
}

export { initHorizontalAutoScroll, advanceScroller }
