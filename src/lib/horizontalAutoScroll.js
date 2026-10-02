import { getHomepageSettings } from '../services/homepageService'

const DEFAULT_AUTO_SCROLL_INTERVAL = 4000
const DEFAULT_USER_PAUSE_DURATION = 60000
const AUTO_SCROLL_DURATION = 650

const isHorizontalScroller = (element) => {
  if (!(element instanceof HTMLElement)) return false
  if (element.scrollWidth <= element.clientWidth + 2) return false
  const overflowX = getComputedStyle(element).overflowX
  return overflowX === 'auto' || overflowX === 'scroll'
}

const getNextScrollPosition = (element) => {
  const current = element.scrollLeft
  const children = Array.from(element.children).filter((child) => child instanceof HTMLElement)
  const next = children.find((child) => child.offsetLeft > current + 8)
  if (next) return Math.min(next.offsetLeft, element.scrollWidth - element.clientWidth)
  return 0
}

const advanceScroller = (element) => {
  if (!isHorizontalScroller(element)) return
  const nextPosition = getNextScrollPosition(element)
  element.scrollTo({ left: nextPosition, behavior: 'smooth' })
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
  let pauseDuration = DEFAULT_USER_PAUSE_DURATION
  let enabled = true

  try {
    const settings = await getHomepageSettings()
    const config = settings?.horizontalAutoScroll || {}
    enabled = config.enabled !== false
    interval = Math.max(1000, Math.min(60000, Number(config.intervalMs) || DEFAULT_AUTO_SCROLL_INTERVAL))
    pauseDuration = Math.max(10000, Math.min(300000, Number(config.pauseAfterInteractionMs) || DEFAULT_USER_PAUSE_DURATION))
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
    timers.set(element, window.setInterval(() => advanceScroller(element), interval))
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

export { initHorizontalAutoScroll, advanceScroller, AUTO_SCROLL_DURATION }
