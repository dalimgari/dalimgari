import { createElement, useId, useState } from 'react'
import { upload_media, get_media_library, save_external_media } from '../../controller/media/global_media_controller'

export function global_media_uploader({ on_select = () => {}, accept = 'image/*', label = 'মিডিয়া নির্বাচন' }) {
  const id = useId()
  const [method, set_method] = useState('upload')
  const [media_url, set_media_url] = useState('')
  const [library, set_library] = useState([])
  const [selected, set_selected] = useState(null)
  const [message, set_message] = useState('')
  const [loading, set_loading] = useState(false)

  function select_media(media) {
    set_selected(media)
    on_select(media)
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

  async function handle_upload(event) {
    const file = event.target.files?.[0]
    if (!file) return
    set_loading(true)
    set_message('')
    try {
      const media = await upload_media(file)
      select_media(media)
      set_message('আপলোড সম্পন্ন হয়েছে')
    } catch {
      set_message('আপলোড করা যায়নি')
    } finally {
      set_loading(false)
      event.target.value = ''
    }
  }

  async function handle_external() {
    if (!media_url.trim()) return
    set_loading(true)
    set_message('')
    try {
      const media = await save_external_media(media_url.trim())
      select_media(media)
      set_message('মিডিয়া সংরক্ষণ করা হয়েছে')
      set_media_url('')
    } catch {
      set_message('URL সংরক্ষণ করা যায়নি')
    } finally {
      set_loading(false)
    }
  }

  return createElement('section', { className: 'global-media-uploader', 'aria-label': label },
    createElement('div', { className: 'form-field' },
      createElement('label', { htmlFor: `${id}-method` }, 'মিডিয়া নির্বাচন পদ্ধতি'),
      createElement('select', { id: `${id}-method`, value: method, disabled: loading, onChange: (event) => set_method(event.target.value) },
        createElement('option', { value: 'upload' }, 'ডিভাইস থেকে আপলোড'),
        createElement('option', { value: 'select' }, 'মিডিয়া লাইব্রেরি থেকে নির্বাচন'),
        createElement('option', { value: 'url' }, 'বাহ্যিক URL ব্যবহার')
      )
    ),
    method === 'upload' && createElement('div', { className: 'form-field' },
      createElement('label', { htmlFor: `${id}-file` }, 'ফাইল নির্বাচন করুন'),
      createElement('input', { id: `${id}-file`, type: 'file', accept, disabled: loading, onChange: handle_upload })
    ),
    method === 'select' && createElement('div', { className: 'media-library-actions' },
      createElement('button', { type: 'button', onClick: load_library, disabled: loading }, loading ? 'লোড হচ্ছে…' : 'মিডিয়া লোড করুন'),
      library.map((media) => createElement('button', { type: 'button', key: media.media_id, onClick: () => select_media(media), 'aria-pressed': selected?.media_id === media.media_id }, media.original_name ?? 'মিডিয়া'))
    ),
    method === 'url' && createElement('div', { className: 'media-url-row' },
      createElement('label', { htmlFor: `${id}-url` }, 'বাহ্যিক মিডিয়া URL'),
      createElement('input', { id: `${id}-url`, type: 'url', value: media_url, disabled: loading, onChange: (event) => set_media_url(event.target.value), placeholder: 'https://...', autoComplete: 'url' }),
      createElement('button', { type: 'button', onClick: handle_external, disabled: loading || !media_url.trim() }, loading ? 'সংরক্ষণ হচ্ছে…' : 'URL ব্যবহার করুন')
    ),
    selected && createElement('p', { className: 'media-selection-summary', role: 'status' }, `নির্বাচিত: ${selected.original_name ?? selected.media_url ?? 'মিডিয়া'}`),
    createElement('div', { className: 'media-status', 'aria-live': 'polite' }, message)
  )
}
