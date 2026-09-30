export function has_role(roles = [], required) { return !required || roles.includes('*') || roles.includes(required) }
