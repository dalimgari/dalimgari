export const NUMBER_INPUT_CONFIG = Object.freeze({ method: 'number', control: 'input', type: 'number', supports: ['label','value','placeholder','required','disabled','min','max','step'] })
export function number_input({ label, value = '', on_change = () => {}, ...props }) {
  return <label className="admin-form-field"><span>{label}</span><input type="number" value={value ?? ''} onChange={(e) => on_change(e.target.value === '' ? '' : Number(e.target.value))} {...props} /></label>
}
