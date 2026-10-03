export default function Input({ label, error, id, className = '', ...props }) {
  const classes = ['ui-input', error ? 'ui-input--error' : '', className].filter(Boolean).join(' ')
  return (
    <label className="ui-field" htmlFor={id}>
      {label ? <span className="ui-field__label">{label}</span> : null}
      <input id={id} className={classes} {...props} />
      {error ? <span className="ui-field__error">{error}</span> : null}
    </label>
  )
}
