export const TEXT_INPUT_CONFIG = Object.freeze({ method: 'text', control: 'input', type: 'text', supports: ['label','value','placeholder','required','disabled','minLength','maxLength','pattern'] })
export function text_input({ label, value = '', on_change = () => {}, ...props }) {
  return <label className="admin-form-field"><span>{label}</span><input type="text" value={value ?? ''} onChange={(e) => on_change(e.target.value)} {...props} /></label>
}
