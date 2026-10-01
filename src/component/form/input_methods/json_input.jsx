import { useState } from 'react'
export const JSON_INPUT_CONFIG = Object.freeze({ method: 'json', control: 'textarea', format: 'json', supports: ['label','value','placeholder','required','disabled','rows','schema'] })
function stringify(value) { if (value === null || value === undefined || value === '') return ''; if (typeof value === 'string') return value; try { return JSON.stringify(value, null, 2) } catch { return '' } }
export function json_input({ label, value = null, on_change = () => {}, rows = 8, ...props }) {
  const [error, set_error] = useState('')
  return <label className="admin-form-field"><span>{label}</span><textarea value={stringify(value)} rows={rows} aria-invalid={Boolean(error)} onChange={(e) => { const text = e.target.value; if (!text.trim()) { set_error(''); on_change(null); return } try { const parsed = JSON.parse(text); set_error(''); on_change(parsed) } catch { set_error('সঠিক JSON দিন') } }} {...props} />{error && <small role="alert">{error}</small>}</label>
}
