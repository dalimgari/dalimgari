const listeners = new Set(); let current = null
export function open_modal(payload) { current = payload; listeners.forEach(fn => fn(current)); return current }
export function close_modal() { current = null; listeners.forEach(fn => fn(current)) }
export function subscribe_modal(fn) { listeners.add(fn); return () => listeners.delete(fn) }
