export const SELECT_INPUT_CONFIG = Object.freeze({ method: 'select', control: 'select', supports: ['label','value','options','required','disabled','placeholder'] })
export function select_input({ label, value = '', on_change = () => {}, options = [], placeholder = 'নির্বাচন করুন', ...props }) {
  return <label className="admin-form-field"><span>{label}</span><select value={value ?? ''} onChange={(e) => on_change(e.target.value)} {...props}><option value="">{placeholder}</option>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
}
