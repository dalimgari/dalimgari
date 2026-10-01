import { text_input, TEXT_INPUT_CONFIG } from './text_input'
import { textarea_input, TEXTAREA_INPUT_CONFIG } from './textarea_input'
import { RichTextInput, RICH_TEXT_INPUT_CONFIG } from './rich_text_input'
import { email_input, EMAIL_INPUT_CONFIG } from './email_input'
import { phone_input, PHONE_INPUT_CONFIG } from './phone_input'
import { url_input, URL_INPUT_CONFIG } from './url_input'
import { slug_input, SLUG_INPUT_CONFIG } from './slug_input'
import { media_input, MEDIA_INPUT_CONFIG } from './media_input'
import { number_input, NUMBER_INPUT_CONFIG } from './number_input'
import { date_input, DATE_INPUT_CONFIG } from './date_input'
import { datetime_input, DATETIME_INPUT_CONFIG } from './datetime_input'
import { SwitchInput, SWITCH_INPUT_CONFIG } from './switch_input'
import { select_input, SELECT_INPUT_CONFIG } from './select_input'
import { multi_select_input, MULTI_SELECT_INPUT_CONFIG } from './multi_select_input'
import { relation_input, RELATION_INPUT_CONFIG } from './relation_input'
import { json_input, JSON_INPUT_CONFIG } from './json_input'
import { ReadonlyInput, READONLY_INPUT_CONFIG } from './readonly_input'

export const GLOBAL_INPUT_REGISTRY = Object.freeze({
  text: { ...TEXT_INPUT_CONFIG, component: text_input },
  textarea: { ...TEXTAREA_INPUT_CONFIG, component: textarea_input },
  rich_text: { ...RICH_TEXT_INPUT_CONFIG, component: RichTextInput },
  email: { ...EMAIL_INPUT_CONFIG, component: email_input },
  phone: { ...PHONE_INPUT_CONFIG, component: phone_input },
  url: { ...URL_INPUT_CONFIG, component: url_input },
  slug: { ...SLUG_INPUT_CONFIG, component: slug_input },
  image: { ...MEDIA_INPUT_CONFIG, method: 'image', accept: 'image/*', component: media_input },
  file: { ...MEDIA_INPUT_CONFIG, method: 'file', component: media_input },
  media: { ...MEDIA_INPUT_CONFIG, component: media_input },
  number: { ...NUMBER_INPUT_CONFIG, component: number_input },
  date: { ...DATE_INPUT_CONFIG, component: date_input },
  datetime: { ...DATETIME_INPUT_CONFIG, component: datetime_input },
  switch: { ...SWITCH_INPUT_CONFIG, component: SwitchInput },
  select: { ...SELECT_INPUT_CONFIG, component: select_input },
  multi_select: { ...MULTI_SELECT_INPUT_CONFIG, component: multi_select_input },
  relation: { ...RELATION_INPUT_CONFIG, component: relation_input },
  json: { ...JSON_INPUT_CONFIG, component: json_input },
  system: { ...READONLY_INPUT_CONFIG, component: ReadonlyInput }
})

export const GLOBAL_INPUT_METHODS = Object.freeze(Object.keys(GLOBAL_INPUT_REGISTRY))

export function get_global_input_definition(method) {
  return GLOBAL_INPUT_REGISTRY[method] ?? GLOBAL_INPUT_REGISTRY.text
}
