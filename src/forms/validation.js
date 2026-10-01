export function validateField(field = {}, value) {
  const errors = []
  const label = getLabel(field)

  if (field.required) {
    const empty = value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0)
    if (empty) errors.push(`${label} আবশ্যক`)
  }

  if (field.type === 'email' && value) {
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value))
    if (!valid) errors.push(`${label} সঠিক নয়`)
  }

  if (field.minLength && value && String(value).length < field.minLength) {
    errors.push(`${label}-এ অন্তত ${field.minLength}টি অক্ষর প্রয়োজন`)
  }

  if (field.maxLength && value && String(value).length > field.maxLength) {
    errors.push(`${label}-এ সর্বোচ্চ ${field.maxLength}টি অক্ষর হতে পারে`)
  }

  return errors
}

function getLabel(field) {
  return field.label || field.name || field.key || 'এই ঘর'
}
