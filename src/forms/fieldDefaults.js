export function getFieldLabel(field = {}) {
  return field.label || field.name || field.key || ''
}

export function getFieldDefaultValue(field = {}) {
  if (field.defaultValue !== undefined) return field.defaultValue
  if (field.type === 'checkbox') return false
  return ''
}
