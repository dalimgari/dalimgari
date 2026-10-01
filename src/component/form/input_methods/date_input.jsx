export const DATE_INPUT_CONFIG = Object.freeze({ method: 'date', control: 'input', type: 'date', supports: ['label','value','required','disabled','min','max'] })
export function date_input({ label, value = '', on_change = () => {}, ...props }) {
  return <label className="admin-form-field"><span>{label}</span><input type="date" value={value ?? ''} onChange={(e) => on_change(e.target.value)} {...props} /></label>
}
