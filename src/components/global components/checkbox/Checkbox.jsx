export default function Checkbox({ label, id, className = '', ...props }) {
  return (
    <label className={`ui-check ${className}`.trim()} htmlFor={id}>
      <input id={id} type="checkbox" {...props} />
      <span>{label}</span>
    </label>
  )
}
