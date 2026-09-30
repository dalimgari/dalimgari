export function viewport_width() { return typeof window === 'undefined' ? 0 : window.innerWidth }
export function is_mobile() { return viewport_width() < 768 }
export function is_tablet() { const width = viewport_width(); return width >= 768 && width < 1024 }
