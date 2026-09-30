export function has_permission(permissions = [], required) { return !required || permissions.includes('*') || permissions.includes(required) }
export function has_any_permission(permissions = [], required = []) { return required.some(item => has_permission(permissions, item)) }
