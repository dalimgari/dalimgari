import { useEffect } from 'react'

export default function MediaViewer({ url, alt = '', onClose }) {
  useEffect(() => {
    function handleKey(event) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = previous
    }
  }, [onClose])

  return <div className="media-viewer" role="dialog" aria-modal="true" aria-label="ছবি দেখুন" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
    <button className="media-viewer__close" type="button" onClick={onClose} aria-label="বন্ধ করুন">✕</button>
    <img src={url} alt={alt} className="media-viewer__image" />
  </div>
}
