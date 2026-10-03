export default function Radio({ label, id, className = '', ...props }) {
  return (
    <label className={`ui-check ui-radio ${className}`.trim()} htmlFor={id}>
      <input id={id} type="radio" {...props} />
      <span>{label}</span>
    </label>
  )
}
