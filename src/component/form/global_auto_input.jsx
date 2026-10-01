import { createElement, useMemo, useState } from 'react'
import { global_input_selector } from '../../utility/helper/global_input_selector'
import { global_media_uploader } from '../media/global_media_uploader'

function field_label(label, field_name) {
  return label || String(field_name ?? '').replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function json_text(value) {
  if (value === null || value === undefined || value === '') return ''
  if (typeof value === 'string') return value
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return ''
  }
}

function parse_json(value) {
  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}

function local_datetime_value(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 16)
  const offset = date.getTimezoneOffset()
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 16)
}

export function global_auto_input({
  field_name,
  value,
  on_change = () => {},
  label,
  db_type,
  enum_values = [],
  relation = false,
  relation_options = [],
  override,
  input_method,
  system = false,
  placeholder = '',
  disabled = false,
  required = false,
  accept = '*/*',
  multiple = false,
  min,
  max,
  step
}) {
  const method = useMemo(() => global_input_selector({
    field_name,
    db_type,
    enum_values,
    relation,
    override,
    input_method,
    system
  }), [field_name, db_type, enum_values, relation, override, input_method, system])

  const resolved_label = field_label(label, field_name)
  const [json_error, set_json_error] = useState('')

  if (method === 'system') {
    return createElement('label', { className: 'admin-form-field is-readonly' },
      createElement('span', null, resolved_label),
      createElement('input', { value: value ?? '', readOnly: true, disabled: true })
    )
  }

  if (method === 'image' || method === 'file' || method === 'media') {
    return createElement(global_media_uploader, {
      label: resolved_label,
      accept: method === 'image' ? 'image/*' : accept,
      multiple,
      initial_url: value ?? '',
      on_select: (media) => {
        if (multiple && Array.isArray(media)) {
          on_change(media.map((item) => item?.media_url).filter(Boolean).join('\n'))
        } else {
          on_change(media?.media_url ?? '')
        }
      }
    })
  }

  if (method === 'textarea' || method === 'rich_text') {
    return createElement('label', { className: 'admin-form-field' },
      createElement('span', null, resolved_label),
      createElement('textarea', {
        value: value ?? '',
        placeholder,
        disabled,
        required,
        rows: method === 'rich_text' ? 12 : 5,
        onChange: (event) => on_change(event.target.value)
      })
    )
  }

  if (method === 'json') {
    return createElement('label', { className: 'admin-form-field' },
      createElement('span', null, resolved_label),
      createElement('textarea', {
        value: json_text(value),
        placeholder: placeholder || '{ }',
        disabled,
        required,
        rows: 8,
        'aria-invalid': Boolean(json_error),
        onChange: (event) => {
          const next = event.target.value
          set_json_error('')
          if (!next.trim()) return on_change(null)
          const parsed = parse_json(next)
          if (typeof parsed === 'string') {
            set_json_error('সঠিক JSON দিন')
            return
          }
          on_change(parsed)
        }
      }),
      json_error && createElement('small', { role: 'alert' }, json_error)
    )
  }

  if (method === 'switch') {
    return createElement('label', { className: 'admin-form-check' },
      createElement('input', {
        type: 'checkbox',
        checked: Boolean(value),
        disabled,
        onChange: (event) => on_change(event.target.checked)
      }),
      createElement('span', null, resolved_label)
    )
  }

  if (method === 'select' || method === 'multi_select') {
    const options = enum_values.length
      ? enum_values.map((item) => ({ value: item, label: String(item).replace(/_/g, ' ') }))
      : relation_options

    if (method === 'multi_select') {
      const selected = Array.isArray(value) ? value : []
      return createElement('label', { className: 'admin-form-field' },
        createElement('span', null, resolved_label),
        createElement('select', {
          multiple: true,
          value: selected,
          disabled,
          required,
          onChange: (event) => on_change(Array.from(event.target.selectedOptions).map((option) => option.value))
        },
          options.map((option) => createElement('option', { key: option.value, value: option.value }, option.label))
        )
      )
    }

    return createElement('label', { className: 'admin-form-field' },
      createElement('span', null, resolved_label),
      createElement('select', {
        value: value ?? '',
        disabled,
        required,
        onChange: (event) => on_change(event.target.value)
      },
        createElement('option', { value: '' }, 'নির্বাচন করুন'),
        options.map((option) => createElement('option', { key: option.value, value: option.value }, option.label))
      )
    )
  }

  if (method === 'relation') {
    return createElement('label', { className: 'admin-form-field' },
      createElement('span', null, resolved_label),
      createElement('select', {
        value: value ?? '',
        disabled,
        required,
        onChange: (event) => on_change(event.target.value)
      },
        createElement('option', { value: '' }, 'নির্বাচন করুন'),
        relation_options.map((option) => createElement('option', { key: option.value, value: option.value }, option.label))
      )
    )
  }

  let type = 'text'
  if (method === 'email') type = 'email'
  if (method === 'phone') type = 'tel'
  if (method === 'url') type = 'url'
  if (method === 'number') type = 'number'
  if (method === 'date') type = 'date'
  if (method === 'datetime') type = 'datetime-local'

  const input_value = method === 'datetime' ? local_datetime_value(value) : (value ?? '')

  return createElement('label', { className: 'admin-form-field' },
    createElement('span', null, resolved_label),
    createElement('input', {
      type,
      value: input_value,
      placeholder: method === 'slug' ? 'example-page' : placeholder,
      disabled,
      required,
      min,
      max,
      step,
      onChange: (event) => on_change(event.target.value)
    })
  )
}
