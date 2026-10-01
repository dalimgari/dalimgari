export default function Checkbox({ label, id, ...props }) {
  return (
    <label className="ui-check" htmlFor={id}>
      <input id={id} type="checkbox" {...props} />
      <span>{label}</span>
    </label>
  )
}
