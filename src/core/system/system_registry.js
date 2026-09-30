const registry = new Map()
export function register_system(name, system) { registry.set(name, system); return system }
export function get_system(name) { return registry.get(name) }
export function get_systems() { return Object.fromEntries(registry) }
