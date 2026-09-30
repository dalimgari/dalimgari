export function get_localized_value(value, language = 'bn') {
  if (!value) return ''
  if (typeof value === 'string') return value
  return value[language] ?? value.bn ?? value.en ?? ''
}
