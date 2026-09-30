const flags = new Map()
export function is_feature_enabled(name, fallback = false) { return flags.has(name) ? flags.get(name) : fallback }
export function set_feature_flag(name, enabled) { flags.set(name, Boolean(enabled)) }
export function get_feature_flags() { return Object.fromEntries(flags) }
