export const URL_INPUT_CONFIG = Object.freeze({ method: 'url', control: 'input', type: 'url', supports: ['label','value','placeholder','required','disabled'] })
export function url_input({ label, value = '', on_change = () => {}, ...props }) {
  return <label className="admin-form-field"><span>{label}</span><input type="url" value={value ?? ''} onChange={(e) => on_change(e.target.value)} {...props} /></label>
}
