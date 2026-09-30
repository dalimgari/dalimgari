const icons = new Map()
export function register_icon(name, component) { icons.set(name, component); return component }
export function get_icon(name) { return icons.get(name) }
