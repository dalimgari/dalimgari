export const MULTI_SELECT_INPUT_CONFIG = Object.freeze({ method: 'multi_select', control: 'select', multiple: true, supports: ['label','value','options','required','disabled'] })
export function multi_select_input({ label, value = [], on_change = () => {}, options = [], ...props }) {
  const selected = Array.isArray(value) ? value : []
  return <label className="admin-form-field"><span>{label}</span><select multiple value={selected} onChange={(e) => on_change(Array.from(e.target.selectedOptions).map((option) => option.value))} {...props}>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
}
