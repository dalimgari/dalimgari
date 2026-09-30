const states = new Map()
export function set_loading(key, value = true) { states.set(key, Boolean(value)); return value }
export function is_loading(key) { return states.get(key) === true }
