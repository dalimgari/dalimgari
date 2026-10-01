export const INPUT_METHODS = Object.freeze({
  text: 'text',
  number: 'number',
  email: 'email',
  password: 'password',
  date: 'date',
  time: 'time',
  file: 'file',
  select: 'select',
  checkbox: 'checkbox',
  radio: 'radio',
  textarea: 'textarea',
})

export const INPUT_COMPONENTS = Object.freeze({
  text: 'Input',
  number: 'Input',
  email: 'Input',
  password: 'Input',
  date: 'Input',
  time: 'Input',
  file: 'Input',
  select: 'Select',
  checkbox: 'Checkbox',
  radio: 'Radio',
  textarea: 'Textarea',
})

export function getInputMethod(field = {}) {
  if (field.inputMethod && INPUT_METHODS[field.inputMethod]) return field.inputMethod
  if (field.type && INPUT_METHODS[field.type]) return field.type
  return INPUT_METHODS.text
}
