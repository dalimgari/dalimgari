export default function Input({ label, error, id, ...props }) {
  return (
    <label className="ui-field" htmlFor={id}>
      {label ? <span className="ui-field__label">{label}</span> : null}
      <input id={id} className={`ui-input${error ? ' ui-input--error' : ''}`} {...props} />
      {error ? <span className="ui-field__error">{error}</span> : null}
    </label>
  )
}
