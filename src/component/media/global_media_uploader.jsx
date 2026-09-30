import { createElement, useState } from 'react'
import { upload_media, get_media_library, save_external_media } from '../../controller/media/global_media_controller'

export function global_media_uploader({ on_select = () => {} }) {
  const [method, set_method] = useState('select')
  const [media_url, set_media_url] = useState('')
  const [library, set_library] = useState([])
  const [message, set_message] = useState('')

  async function load_library() {
    set_library(await get_media_library())
  }

  async function handle_upload(event) {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      const media = await upload_media(file)
      on_select(media)
      set_message('আপলোড সম্পন্ন হয়েছে')
    } catch {
      set_message('আপলোড করা যায়নি')
    }
  }

  async function handle_external() {
    if (!media_url) return
    try {
      const media = await save_external_media(media_url)
      on_select(media)
      set_message('মিডিয়া সংরক্ষণ করা হয়েছে')
    } catch {
      set_message('URL সংরক্ষণ করা যায়নি')
    }
  }

  return createElement('section', { className: 'global-media-uploader', 'aria-label': 'মিডিয়া নির্বাচন' },
    createElement('div', { className: 'form-field' },
      createElement('label', { htmlFor: 'global-media-method' }, 'মিডিয়া পদ্ধতি'),
      createElement('select', { id: 'global-media-method', value: method, onChange: (event) => set_method(event.target.value) },
        createElement('option', { value: 'upload' }, 'ফাইল আপলোড'),
        createElement('option', { value: 'select' }, 'মিডিয়া লাইব্রেরি থেকে নির্বাচন'),
        createElement('option', { value: 'url' }, 'URL ব্যবহার')
      )
    ),
    method === 'upload' && createElement('div', { className: 'form-field' },
      createElement('label', { htmlFor: 'global-media-file' }, 'ফাইল নির্বাচন করুন'),
      createElement('input', { id: 'global-media-file', type: 'file', onChange: handle_upload })
    ),
    method === 'select' && createElement('div', { className: 'media-library-actions' },
      createElement('button', { type: 'button', onClick: load_library }, 'মিডিয়া লোড করুন'),
      library.map((media) => createElement('button', { type: 'button', key: media.media_id, onClick: () => on_select(media) }, media.original_name ?? media.media_url))
    ),
    method === 'url' && createElement('div', { className: 'media-url-row' },
      createElement('input', { type: 'url', value: media_url, onChange: (event) => set_media_url(event.target.value), placeholder: 'https://...' }),
      createElement('button', { type: 'button', onClick: handle_external }, 'URL ব্যবহার করুন')
    ),
    createElement('div', { className: 'media-status', 'aria-live': 'polite' }, message)
  )
}
