export const READONLY_INPUT_CONFIG = Object.freeze({ method: 'system', control: 'readonly', readOnly: true })
export function ReadonlyInput({ label, value = '' }) {
  return <label className="admin-form-field is-readonly"><span>{label}</span><input value={value ?? ''} readOnly disabled /></label>
}
