export function is_safe_url(value) { try { const url = new URL(value, window.location.origin); return ['http:', 'https:'].includes(url.protocol) } catch { return false } }
