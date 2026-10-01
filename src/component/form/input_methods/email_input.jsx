export const EMAIL_INPUT_CONFIG = Object.freeze({ method: 'email', control: 'input', type: 'email', supports: ['label','value','placeholder','required','disabled','minLength','maxLength'] })
export function email_input({ label, value = '', on_change = () => {}, ...props }) {
  return <label className="admin-form-field"><span>{label}</span><input type="email" value={value ?? ''} onChange={(e) => on_change(e.target.value)} {...props} /></label>
}
