import { useEffect, useRef, useState } from 'react'

export default function DragReorderList({ items = [], getKey, onReorder, renderItem, label = 'ক্রম সাজানোর তালিকা' }) {
  const [dragIndex, setDragIndex] = useState(-1)
  const [overIndex, setOverIndex] = useState(-1)
  const containerRef = useRef(null)
  const activePointerId = useRef(null)
  const startIndex = useRef(-1)
  const currentIndex = useRef(-1)

  function getTargetIndex(clientY) {
    const container = containerRef.current
    if (!container) return -1
    const nodes = Array.from(container.querySelectorAll('.drag-reorder__item'))
    let bestIndex = -1
    let bestDistance = Infinity
    nodes.forEach((node, index) => {
      if (index === startIndex.current) return
      const rect = node.getBoundingClientRect()
      const distance = Math.abs(clientY - (rect.top + rect.height / 2))
      if (distance < bestDistance) {
        bestDistance = distance
        bestIndex = index
      }
    })
    return bestIndex
  }

  function startDrag(index, event) {
    if (event.button !== undefined && event.button !== 0) return
    event.preventDefault()
    activePointerId.current = event.pointerId
    startIndex.current = index
    currentIndex.current = index
    setDragIndex(index)
    setOverIndex(index)
    event.currentTarget.setPointerCapture?.(event.pointerId)
  }

  function moveDrag(event) {
    if (activePointerId.current !== event.pointerId || startIndex.current < 0) return
    event.preventDefault()
    const target = getTargetIndex(event.clientY)
    if (target >= 0) {
      currentIndex.current = target
      setOverIndex(target)
    }
  }

  function finishDrag(event) {
    if (activePointerId.current !== event.pointerId || startIndex.current < 0) return
    event.preventDefault()

    const from = startIndex.current
    const to = currentIndex.current
    if (from !== to && to >= 0 && to < items.length) {
      const next = [...items]
      const [moved] = next.splice(from, 1)
      next.splice(to, 0, moved)
      onReorder(next)
    }

    activePointerId.current = null
    startIndex.current = -1
    currentIndex.current = -1
    setDragIndex(-1)
    setOverIndex(-1)
    event.currentTarget.releasePointerCapture?.(event.pointerId)
  }

  useEffect(() => {
    function cancelDrag() {
      activePointerId.current = null
      startIndex.current = -1
      currentIndex.current = -1
      setDragIndex(-1)
      setOverIndex(-1)
    }
    window.addEventListener('pointercancel', cancelDrag)
    window.addEventListener('blur', cancelDrag)
    return () => {
      window.removeEventListener('pointercancel', cancelDrag)
      window.removeEventListener('blur', cancelDrag)
    }
  }, [])

  if (!items.length) return null

  return (
    <div className="drag-reorder" aria-label={label} ref={containerRef}>
      <div className="drag-reorder__hint">☷ ধরে টেনে ছেড়ে দিয়ে ক্রম সাজান</div>
      <div className="drag-reorder__list">
        {items.map((item, index) => {
          const key = getKey(item)
          return (
            <div
              key={key}
              className={
                'drag-reorder__item' +
                (dragIndex === index ? ' is-dragging' : '') +
                (overIndex === index && dragIndex !== index ? ' is-over' : '')
              }
            >
              <button
                type="button"
                className="drag-reorder__handle"
                aria-label={`এই আইটেমটি ধরে টেনে ক্রম পরিবর্তন করুন: ${key}`}
                onPointerDown={(event) => startDrag(index, event)}
                onPointerMove={moveDrag}
                onPointerUp={finishDrag}
                onPointerCancel={finishDrag}
                style={{ touchAction: 'none', cursor: 'grab' }}
              >
                ⋮⋮
              </button>
              <div className="drag-reorder__content">{renderItem(item, index)}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
