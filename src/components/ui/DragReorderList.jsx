import { useRef, useState } from 'react'

export default function DragReorderList({ items = [], getKey, onReorder, renderItem, label = 'ক্রম সাজানোর তালিকা' }) {
  const [dragKey, setDragKey] = useState(null)
  const [overKey, setOverKey] = useState(null)
  const dragIndex = useRef(-1)

  function startDrag(index, event) {
    dragIndex.current = index
    setDragKey(getKey(items[index]))
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', String(getKey(items[index])))
  }

  function over(index, event) {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
    const key = getKey(items[index])
    if (key !== dragKey) setOverKey(key)
  }

  function drop(index, event) {
    event.preventDefault()
    const from = dragIndex.current
    if (from < 0 || from === index) {
      setDragKey(null)
      setOverKey(null)
      return
    }
    const next = [...items]
    const [moved] = next.splice(from, 1)
    next.splice(index, 0, moved)
    onReorder(next)
    setDragKey(null)
    setOverKey(null)
    dragIndex.current = -1
  }

  function endDrag() {
    setDragKey(null)
    setOverKey(null)
    dragIndex.current = -1
  }

  if (!items.length) return null

  return (
    <div className="drag-reorder" aria-label={label}>
      <div className="drag-reorder__hint">☷ টেনে ধরে ছেড়ে দিয়ে ক্রম সাজান</div>
      <div className="drag-reorder__list">
        {items.map((item, index) => {
          const key = getKey(item)
          return (
            <div
              key={key}
              className={'drag-reorder__item' + (dragKey === key ? ' is-dragging' : '') + (overKey === key ? ' is-over' : '')}
              draggable
              onDragStart={(event) => startDrag(index, event)}
              onDragOver={(event) => over(index, event)}
              onDrop={(event) => drop(index, event)}
              onDragEnd={endDrag}
            >
              <span className="drag-reorder__handle" aria-hidden="true">⋮⋮</span>
              <div className="drag-reorder__content">{renderItem(item, index)}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
