export function is_scheduled(date) { return Boolean(date) && new Date(date).getTime() > Date.now() }
