import { global_media_uploader as GlobalMediaUploader } from '../../media/global_media_uploader'
export const IMAGE_INPUT_CONFIG = Object.freeze({ method: 'image', control: 'media_uploader', accept: 'image/*', supports: ['label','value','required','disabled','multiple','album_id'] })
export function image_input({ label, value = '', on_change = () => {}, multiple = false, disabled = false, ...props }) {
  return <GlobalMediaUploader label={label} initial_url={value ?? ''} accept="image/*" multiple={multiple} disabled={disabled} on_select={(media) => on_change(Array.isArray(media) ? media.map((item) => item?.media_url).filter(Boolean) : (media?.media_url ?? ''))} {...props} />
}
