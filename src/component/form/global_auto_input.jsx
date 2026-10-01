import { createElement } from 'react'
import { global_input_selector } from '../../utility/helper/global_input_selector'
import { get_global_input_definition } from './input_methods'

function field_label(label, field_name) {
  const name = String(field_name ?? '').trim()
  const fallback = name.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
  if (!name) return label || ''
  if (!label || label === name || label === fallback) return name
  return `${label} (${name})`
}

export function global_auto_input({
  field_name, value, on_change = () => {}, label, db_type, enum_values = [],
  relation = false, relation_options = [], override, input_method, system = false,
  placeholder = '', disabled = false, required = false, accept = '*/*', multiple = false,
  min, max, step, options: provided_options, ...rest
}) {
  const method = global_input_selector({ field_name, db_type, enum_values, relation, override, input_method, system })
  const definition = get_global_input_definition(method)
  const Component = definition.component
  const resolved_label = field_label(label, field_name)
  const options = provided_options?.length
    ? provided_options
    : enum_values.length
      ? enum_values.map((item) => ({ value: item, label: String(item).replace(/_/g, ' ') }))
      : relation_options

  return createElement(Component, {
    ...rest, method, label: resolved_label, value, on_change, placeholder, disabled, required,
    accept, multiple, min, max, step, options, relation_options
  })
}
