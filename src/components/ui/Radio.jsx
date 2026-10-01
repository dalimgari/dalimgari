export default function Radio({ label, id, ...props }) {
  return (
    <label className="ui-check" htmlFor={id}>
      <input id={id} type="radio" {...props} />
      <span>{label}</span>
    </label>
  )
}
