export function is_visible(options = {}) { return options.status === 'published' && options.visibility !== 'private' && options.visibility !== 'hidden' }
