import { global_media_uploader } from '../../media/global_media_uploader'
export const FILE_INPUT_CONFIG = Object.freeze({ method: 'file', control: 'media_uploader', supports: ['label','value','placeholder','required','disabled','multiple','accept','album_id'] })
export function file_input({ label, value = '', on_change = () => {}, multiple = false, accept = '*/*', disabled = false, ...props }) {
  return <global_media_uploader label={label} initial_url={value ?? ''} accept={accept} multiple={multiple} disabled={disabled} on_select={(media) => on_change(Array.isArray(media) ? media.map((item) => item?.media_url).filter(Boolean) : (media?.media_url ?? ''))} {...props} />
}
