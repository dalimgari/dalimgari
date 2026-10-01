export const SLUG_INPUT_CONFIG = Object.freeze({ method: 'slug', control: 'input', type: 'text', supports: ['label','value','placeholder','required','disabled','maxLength','auto_generate'] })
function normalize_slug(value) { return String(value ?? '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') }
export function slug_input({ label, value = '', on_change = () => {}, auto_generate = true, ...props }) {
  return <label className="admin-form-field"><span>{label}</span><input type="text" value={value ?? ''} onChange={(e) => on_change(auto_generate ? normalize_slug(e.target.value) : e.target.value)} {...props} /></label>
}
