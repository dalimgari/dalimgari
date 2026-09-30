const listeners = new Set(); let items = []
export function notify(message, type = 'info', duration = 4000) { const item = { id: crypto.randomUUID(), message, type }; items = [...items, item]; listeners.forEach(fn => fn(items)); if (duration) setTimeout(() => dismiss_notification(item.id), duration); return item.id }
export function dismiss_notification(id) { items = items.filter(item => item.id !== id); listeners.forEach(fn => fn(items)) }
export function subscribe_notifications(fn) { listeners.add(fn); fn(items); return () => listeners.delete(fn) }
