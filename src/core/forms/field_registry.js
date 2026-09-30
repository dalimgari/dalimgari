const registry = new Map()
export function register_fields(module_name, fields) { registry.set(module_name, fields); return fields }
export function get_fields(module_name) { return registry.get(module_name) || [] }
export function get_field(module_name, field_name) { return get_fields(module_name).find(field => field.name === field_name) || null }
