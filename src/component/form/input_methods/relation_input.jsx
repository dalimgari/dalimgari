export const RELATION_INPUT_CONFIG = Object.freeze({ method: 'relation', control: 'select', supports: ['label','value','relation_table','relation_key','relation_label','relation_options','required','disabled','searchable'] })
export function relation_input({ label, value = '', on_change = () => {}, relation_options = [], ...props }) {
  return <label className="admin-form-field"><span>{label}</span><select value={value ?? ''} onChange={(e) => on_change(e.target.value)} {...props}><option value="">নির্বাচন করুন</option>{relation_options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
}
