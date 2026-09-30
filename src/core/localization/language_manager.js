import { get_localized_value } from '../../function/translation/language'
export { get_localized_value }
export function normalize_language(language = 'bn') { return ['bn', 'en'].includes(language) ? language : 'bn' }
