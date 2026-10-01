import { TextInput, TEXT_INPUT_CONFIG } from './text_input'
import { TextareaInput, TEXTAREA_INPUT_CONFIG } from './textarea_input'
import { RichTextInput, RICH_TEXT_INPUT_CONFIG } from './rich_text_input'
import { EmailInput, EMAIL_INPUT_CONFIG } from './email_input'
import { PhoneInput, PHONE_INPUT_CONFIG } from './phone_input'
import { UrlInput, URL_INPUT_CONFIG } from './url_input'
import { SlugInput, SLUG_INPUT_CONFIG } from './slug_input'
import { ImageInput, IMAGE_INPUT_CONFIG } from './image_input'
import { FileInput, FILE_INPUT_CONFIG } from './file_input'
import { MediaInput, MEDIA_INPUT_CONFIG } from './media_input'
import { NumberInput, NUMBER_INPUT_CONFIG } from './number_input'
import { DateInput, DATE_INPUT_CONFIG } from './date_input'
import { DatetimeInput, DATETIME_INPUT_CONFIG } from './datetime_input'
import { SwitchInput, SWITCH_INPUT_CONFIG } from './switch_input'
import { SelectInput, SELECT_INPUT_CONFIG } from './select_input'
import { MultiSelectInput, MULTI_SELECT_INPUT_CONFIG } from './multi_select_input'
import { RelationInput, RELATION_INPUT_CONFIG } from './relation_input'
import { JsonInput, JSON_INPUT_CONFIG } from './json_input'
import { SystemInput, SYSTEM_INPUT_CONFIG } from './system_input'

export const GLOBAL_INPUT_REGISTRY = Object.freeze({
  text: { ...TEXT_INPUT_CONFIG, component: TextInput },
  textarea: { ...TEXTAREA_INPUT_CONFIG, component: TextareaInput },
  rich_text: { ...RICH_TEXT_INPUT_CONFIG, component: RichTextInput },
  email: { ...EMAIL_INPUT_CONFIG, component: EmailInput },
  phone: { ...PHONE_INPUT_CONFIG, component: PhoneInput },
  url: { ...URL_INPUT_CONFIG, component: UrlInput },
  slug: { ...SLUG_INPUT_CONFIG, component: SlugInput },
  image: { ...IMAGE_INPUT_CONFIG, component: ImageInput },
  file: { ...FILE_INPUT_CONFIG, component: FileInput },
  media: { ...MEDIA_INPUT_CONFIG, component: MediaInput },
  number: { ...NUMBER_INPUT_CONFIG, component: NumberInput },
  date: { ...DATE_INPUT_CONFIG, component: DateInput },
  datetime: { ...DATETIME_INPUT_CONFIG, component: DatetimeInput },
  switch: { ...SWITCH_INPUT_CONFIG, component: SwitchInput },
  select: { ...SELECT_INPUT_CONFIG, component: SelectInput },
  multi_select: { ...MULTI_SELECT_INPUT_CONFIG, component: MultiSelectInput },
  relation: { ...RELATION_INPUT_CONFIG, component: RelationInput },
  json: { ...JSON_INPUT_CONFIG, component: JsonInput },
  system: { ...SYSTEM_INPUT_CONFIG, component: SystemInput }
})

export const GLOBAL_INPUT_METHODS = Object.freeze(Object.keys(GLOBAL_INPUT_REGISTRY))

export function get_global_input_definition(method) {
  return GLOBAL_INPUT_REGISTRY[method] ?? GLOBAL_INPUT_REGISTRY.text
}
