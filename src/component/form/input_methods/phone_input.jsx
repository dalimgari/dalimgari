export const PHONE_INPUT_CONFIG = Object.freeze({ method: 'phone', control: 'input', type: 'tel', supports: ['label','value','placeholder','required','disabled','pattern'] })
export function phone_input({ label, value = '', on_change = () => {}, ...props }) {
  return <label className="admin-form-field"><span>{label}</span><input type="tel" value={value ?? ''} onChange={(e) => on_change(e.target.value)} {...props} /></label>
}
