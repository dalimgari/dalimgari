import { global_media_uploader as GlobalMediaUploader } from '../../media/global_media_uploader'
export const MEDIA_INPUT_CONFIG = Object.freeze({ method: 'media', control: 'media_uploader', supports: ['label','value','placeholder','required','disabled','multiple','accept','album_id'] })
export function media_input({ label, value = '', on_change = () => {}, multiple = false, accept = '*/*', disabled = false, ...props }) {
  return <GlobalMediaUploader label={label} initial_url={value ?? ''} accept={accept} multiple={multiple} disabled={disabled} on_select={(media) => on_change(Array.isArray(media) ? media.map((item) => item?.media_url).filter(Boolean) : (media?.media_url ?? ''))} {...props} />
}
