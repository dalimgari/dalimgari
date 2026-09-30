export function autosave_key(module_name, record_id) { return 'autosave:' + module_name + ':' + record_id }
export function save_autosave(module_name, record_id, data) { localStorage.setItem(autosave_key(module_name, record_id), JSON.stringify(data)); return data }
export function load_autosave(module_name, record_id) { const value = localStorage.getItem(autosave_key(module_name, record_id)); return value ? JSON.parse(value) : null }
export function clear_autosave(module_name, record_id) { localStorage.removeItem(autosave_key(module_name, record_id)) }
