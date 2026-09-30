const cache = new Map()
export function cache_get(key) { const item = cache.get(key); if (!item || (item.expires_at && item.expires_at < Date.now())) { cache.delete(key); return null } return item.value }
export function cache_set(key, value, ttl = 60000) { cache.set(key, { value, expires_at: ttl ? Date.now() + ttl : null }); return value }
export function cache_delete(key) { cache.delete(key) }
export function cache_clear() { cache.clear() }
