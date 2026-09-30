export function unwrap_response(result) { if (result && result.error) throw result.error; return result && result.data !== undefined ? result.data : result }
export function normalize_error(error) { return { message: error && error.message ? error.message : 'Unknown error', code: error && error.code ? error.code : null, details: error && error.details ? error.details : null } }
