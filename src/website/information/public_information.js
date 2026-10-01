export function get_information_map(information) {
  return (information ?? []).reduce((result, item) => {
    result[item.information_key] = item.information_value ?? ''
    return result
  }, {})
}

export function get_information_value(map, key, language = 'bn') {
  const value = map?.[key]
  if (value && typeof value === 'object') return value[language] ?? value.bn ?? value.en ?? ''
  return value ?? ''
}

export function get_contact_icon_paths() {
  return {
    phone: 'M6.6 2.5 9.2 2l2.1 5.1-1.8 1.5c1 2.1 2.8 3.9 4.9 4.9l1.5-1.8 5.1 2.1-.5 2.6c-.2 1.1-1.2 1.9-2.3 1.8C11.8 17.6 6.4 12.2 5.8 5.8 5.7 4.7 6.5 3.7 7.6 3.5L6.6 2.5Z',
    whatsapp: 'M20.5 3.5A11.2 11.2 0 0 0 12.6 1C6.5.7 1.4 5.5 1 11.6c-.1 2.2.5 4.3 1.7 6.1L1 23l5.5-1.7a11.4 11.4 0 0 0 5.8 1.6h.3c6.1-.4 10.9-5.5 10.4-11.6-.2-3-1.1-5.6-2.5-7.8Z',
    email: 'M2.5 4.5h19v15h-19v-15Zm2 2v.3l7.5 5.7 7.5-5.7v-.3h-15Zm15 2.8-7.5 5.7-7.5-5.7v8.2h15V9.3Z'
  }
}

export function get_information_contact_icon(type, create_element) {
  const paths = get_contact_icon_paths()
  return create_element('svg', { viewBox: '0 0 24 24', 'aria-hidden': 'true', focusable: 'false' },
    create_element('path', { d: paths[type] || paths.email })
  )
}
