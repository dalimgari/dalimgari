export const DATETIME_INPUT_CONFIG = Object.freeze({ method: 'datetime', control: 'input', type: 'datetime-local', supports: ['label','value','required','disabled','min','max'] })
function local_value(value) { if (!value) return ''; const date = new Date(value); if (Number.isNaN(date.getTime())) return String(value).slice(0,16); const offset = date.getTimezoneOffset(); return new Date(date.getTime() - offset * 60000).toISOString().slice(0,16) }
export function datetime_input({ label, value = '', on_change = () => {}, ...props }) {
  return <label className="admin-form-field"><span>{label}</span><input type="datetime-local" value={local_value(value)} onChange={(e) => on_change(e.target.value)} {...props} /></label>
}
