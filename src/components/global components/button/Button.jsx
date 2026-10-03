export default function Button({ type = 'button', variant = 'primary', disabled = false, className = '', children, ...props }) {
  const classes = ['ui-button', `ui-button--${variant}`, className].filter(Boolean).join(' ')
  return (
    <button type={type} className={classes} disabled={disabled} {...props}>
      {children}
    </button>
  )
}
