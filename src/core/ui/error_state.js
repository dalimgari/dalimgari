export function error_state(error) { return { title: 'Something went wrong', message: error && error.message ? error.message : 'Unable to complete the request.' } }
