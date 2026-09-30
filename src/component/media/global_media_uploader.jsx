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
      set_message('Uploaded')
    } catch {
      set_message('Upload failed')
    }
  }

  async function handle_external() {
    if (!media_url) return
    try {
      const media = await save_external_media(media_url)
      on_select(media)
      set_message('Saved')
    } catch {
      set_message('Unable to save URL')
    }
  }

  return createElement('section', { className: 'global-media-uploader' },
    createElement('select', { value: method, onChange: (event) => set_method(event.target.value) },
      createElement('option', { value: 'upload' }, 'Upload'),
      createElement('option', { value: 'select' }, 'Select File'),
      createElement('option', { value: 'url' }, 'URL')
    ),
    method === 'upload' && createElement('input', { type: 'file', onChange: handle_upload }),
    method === 'select' && createElement('div', null,
      createElement('button', { type: 'button', onClick: load_library }, 'Load Media'),
      library.map((media) => createElement('button', { type: 'button', key: media.media_id, onClick: () => on_select(media) }, media.original_name ?? media.media_url))
    ),
    method === 'url' && createElement('div', null,
      createElement('input', { type: 'url', value: media_url, onChange: (event) => set_media_url(event.target.value), placeholder: 'https://...' }),
      createElement('button', { type: 'button', onClick: handle_external }, 'Use URL')
    ),
    createElement('span', null, message)
  )
}
