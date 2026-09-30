const config = new Map()
export function get_system_config(key, fallback = null) { return config.has(key) ? config.get(key) : fallback }
export function set_system_config(key, value) { config.set(key, value); return value }
export function get_all_system_config() { return Object.fromEntries(config) }
