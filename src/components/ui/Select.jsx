export default function Select({ label, error, id, options = [], ...props }) {
  return (
    <label className="ui-field" htmlFor={id}>
      {label ? <span className="ui-field__label">{label}</span> : null}
      <select id={id} className={`ui-input${error ? ' ui-input--error' : ''}`} {...props}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
      {error ? <span className="ui-field__error">{error}</span> : null}
    </label>
  )
}
