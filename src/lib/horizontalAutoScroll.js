const AUTO_SCROLL_INTERVAL = 4000
const AUTO_SCROLL_DURATION = 650
const USER_PAUSE_DURATION = 2500

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

const initHorizontalAutoScroll = () => {
  const scrollers = new Set()
  const timers = new Map()
  const pauseTimers = new Map()

  const stopTimer = (element) => {
    const timer = timers.get(element)
    if (timer) window.clearInterval(timer)
    timers.delete(element)
  }

  const schedule = (element) => {
    if (!isHorizontalScroller(element) || timers.has(element)) return
    timers.set(element, window.setInterval(() => advanceScroller(element), AUTO_SCROLL_INTERVAL))
  }

  const pause = (element) => {
    stopTimer(element)
    const previous = pauseTimers.get(element)
    if (previous) window.clearTimeout(previous)
    pauseTimers.set(element, window.setTimeout(() => {
      pauseTimers.delete(element)
      schedule(element)
    }, USER_PAUSE_DURATION))
  }

  const scan = () => {
    document.querySelectorAll('*').forEach((element) => {
      if (!isHorizontalScroller(element)) return
      scrollers.add(element)
      schedule(element)
    })
  }

  document.addEventListener('pointerdown', (event) => {
    const element = event.target instanceof Element ? event.target.closest('*') : null
    if (element && scrollers.has(element)) pause(element)
  }, { passive: true })

  document.addEventListener('wheel', (event) => {
    const element = event.target instanceof Element ? event.target.closest('*') : null
    if (element && scrollers.has(element)) pause(element)
  }, { passive: true })

  scan()
  const observer = new MutationObserver(scan)
  observer.observe(document.body, { childList: true, subtree: true })
}

if (typeof window !== 'undefined') {
  window.addEventListener('load', initHorizontalAutoScroll, { once: true })
}

export { initHorizontalAutoScroll, advanceScroller, AUTO_SCROLL_DURATION }
