export const TEXTAREA_INPUT_CONFIG = Object.freeze({ method: 'textarea', control: 'textarea', supports: ['label','value','placeholder','required','disabled','rows','minLength','maxLength'] })
export function textarea_input({ label, value = '', on_change = () => {}, rows = 5, ...props }) {
  return <label className="admin-form-field"><span>{label}</span><textarea value={value ?? ''} rows={rows} onChange={(e) => on_change(e.target.value)} {...props} /></label>
}
