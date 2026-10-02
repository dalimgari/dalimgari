export function validateField(field = {}, value) {
  const errors = []
  const label = getLabel(field)

  if (field.required) {
    const empty = value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0)
    if (empty) errors.push(label + ' আবশ্যক')
  }

  if (field.type === 'email' && value) {
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value))
    if (!valid) errors.push(label + ' সঠিক নয়')
  }

  if (field.type === 'url' && value) {
    try {
      const parsed = new URL(String(value).trim())
      if (parsed.protocol !== 'https:' || parsed.username || parsed.password) throw new Error('unsafe')
    } catch {
      errors.push(label + '-এ একটি নিরাপদ HTTPS URL দিন')
    }
  }

  if (field.pattern && value && !(new RegExp(field.pattern).test(String(value)))) {
    errors.push(label + ' সঠিক নয়')
  }

  if (field.minLength && value && String(value).length < field.minLength) errors.push(label + '-এ অন্তত ' + field.minLength + 'টি অক্ষর প্রয়োজন')
  if (field.maxLength && value && String(value).length > field.maxLength) errors.push(label + '-এ সর্বোচ্চ ' + field.maxLength + 'টি অক্ষর হতে পারে')
  if (typeof field.min === 'number' && value !== '' && Number(value) < field.min) errors.push(label + ' খুব ছোট')
  if (typeof field.max === 'number' && value !== '' && Number(value) > field.max) errors.push(label + ' খুব বড়')

  return errors
}

export function validateMediaFile(file, { maxSize = 50 * 1024 * 1024, allowedTypes } = {}) {
  if (!file) return ['ফাইল নির্বাচন করুন']
  if (file.size <= 0 || file.size > maxSize) return ['ফাইলের আকার ৫০ MB-এর মধ্যে হতে হবে']
  if (allowedTypes && !allowedTypes.test(file.type || '')) return ['এই ফাইলের ধরন অনুমোদিত নয়']
  return []
}

function getLabel(field) {
  return field.label || field.name || field.key || 'এই ঘর'
}
