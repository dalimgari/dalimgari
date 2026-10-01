import { createElement, useEffect, useId, useState } from 'react'
import { upload_media, get_media_library, save_external_media } from '../../controller/media/global_media_controller'

export function global_media_uploader({
  on_select = () => {},
  on_change = () => {},
  accept = '*/*',
  label = 'মিডিয়া',
  multiple = false,
  initial_url = '',
  value,
  disabled = false,
  method = 'media_uploader',
  field_name = ''
}) {
  const id = useId()
  const resolved_initial_url = value ?? initial_url ?? ''
  const image_field = /(^|_)(image|avatar|logo|icon|thumbnail|cover)(_|$)/i.test(String(field_name))
  const resolved_accept = image_field ? 'image/*' : accept
  const [media_url, set_media_url] = useState(resolved_initial_url)
  const [library, set_library] = useState([])
  const [selected, set_selected] = useState(null)
  const [message, set_message] = useState('')
  const [loading, set_loading] = useState(false)

  useEffect(() => { set_media_url(value ?? initial_url ?? '') }, [value, initial_url])

  function emit_selection(media) {
    on_select(media)
    if (Array.isArray(media)) on_change(media.map((item) => item?.media_url).filter(Boolean))
    else on_change(media?.media_url ?? '')
  }

  function select_media(media) {
    set_selected(media)
    set_media_url(Array.isArray(media) ? media.map((item) => item?.media_url).join('\n') : (media?.media_url ?? ''))
    emit_selection(media)
  }

  async function handle_upload(event) {
    const files = Array.from(event.target.files ?? [])
    if (!files.length) return
    set_loading(true)
    set_message('')
    try {
      const uploaded = []
      for (const file of files) uploaded.push(await upload_media(file))
      select_media(multiple ? uploaded : uploaded[0])
      set_message(uploaded.length > 1 ? `${uploaded.length}টি ফাইল আপলোড সম্পন্ন হয়েছে` : 'আপলোড সম্পন্ন হয়েছে')
    } catch (error) {
      set_message(error?.message || 'আপলোড করা যায়নি')
    } finally {
      set_loading(false)
      event.target.value = ''
    }
  }

  async function handle_external() {
    const value = media_url.trim()
    if (!value) return
    set_loading(true)
    set_message('')
    try {
      const media = await save_external_media(value)
      select_media(media)
      set_message('URL সংরক্ষণ করা হয়েছে')
    } catch (error) {
      set_message(error?.message || 'URL সংরক্ষণ করা যায়নি')
    } finally {
      set_loading(false)
    }
  }

  async function load_library() {
    set_loading(true)
    set_message('')
    try {
      set_library(await get_media_library())
    } catch {
      set_message('মিডিয়া লাইব্রেরি লোড করা যায়নি')
    } finally {
      set_loading(false)
    }
  }

  return createElement('section', { className: 'global-media-uploader', 'aria-label': label },
    createElement('strong', null, label),
    createElement('div', { className: 'admin-form-grid' },
      createElement('label', { className: 'admin-form-field' },
        createElement('span', null, 'ফাইল নির্বাচন করুন'),
        createElement('input', { id: `${id}-file`, type: 'file', accept: resolved_accept, multiple, disabled: loading || disabled, onChange: handle_upload })
      ),
      createElement('label', { className: 'admin-form-field' },
        createElement('span', null, 'File URL'),
        createElement('input', {
          id: `${id}-url`, type: 'url', value: media_url, disabled: loading || disabled,
          onChange: (event) => set_media_url(event.target.value),
          placeholder: 'https://...'
        })
      )
    ),
    createElement('button', { type: 'button', onClick: handle_external, disabled: loading || disabled || !media_url.trim() }, loading ? 'সংরক্ষণ হচ্ছে…' : 'এই URL ব্যবহার করুন'),
    createElement('button', { type: 'button', onClick: load_library, disabled: loading || disabled }, loading ? 'লোড হচ্ছে…' : 'মিডিয়া লাইব্রেরি থেকে নির্বাচন'),
    selected && !Array.isArray(selected) && createElement('div', { className: 'media-selection-summary' },
      createElement('span', null, selected.file_name || 'Media'),
      createElement('a', { href: selected.media_url, target: '_blank', rel: 'noreferrer' }, selected.media_url)
    ),
    Array.isArray(selected) && createElement('p', { className: 'media-selection-summary' }, `${selected.length}টি ফাইল নির্বাচিত`),
    library.length > 0 && createElement('div', { className: 'media-library-actions' },
      library.map((media) => createElement('button', { type: 'button', key: media.media_id, onClick: () => select_media(media) }, media.file_name || media.media_url || 'মিডিয়া'))
    ),
    createElement('div', { className: 'media-status', 'aria-live': 'polite' }, message)
  )
}