const MULTI_KEYS = /content|description|details|bio|address|comment|note|message/i

export default function DisplayField({ label, value, mode = 'auto', title }) {
  const text = value == null || value === '' ? '—' : typeof value === 'object' ? (() => { try { return JSON.stringify(value) } catch { return '—' } })() : String(value)
  const resolvedMode = mode === 'auto' ? (MULTI_KEYS.test(String(label || '')) ? 'multi' : 'single') : mode

  return (
    <span
      className={`ui-display-field ui-display-field--${resolvedMode}`}
      title={title ?? text}
      aria-label={label || undefined}
    >
      <span className="ui-display-field__content">{text}</span>
    </span>
  )
}
