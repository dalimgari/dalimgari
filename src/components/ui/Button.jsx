export default function Button({ type = 'button', variant = 'primary', disabled = false, children, ...props }) {
  return (
    <button type={type} className={`ui-button ui-button--${variant}`} disabled={disabled} {...props}>
      {children}
    </button>
  )
}
