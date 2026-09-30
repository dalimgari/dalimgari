export const system_state = Object.freeze({
  loading: 'loading',
  ready: 'ready',
  empty: 'empty',
  error: 'error'
})

export function resolve_system_state({ loading = false, error = null, has_data = false } = {}) {
  if (loading) return system_state.loading
  if (error) return system_state.error
  if (!has_data) return system_state.empty
  return system_state.ready
}
