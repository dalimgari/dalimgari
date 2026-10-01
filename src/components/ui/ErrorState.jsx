export default function ErrorState({ title = 'তথ্য লোড করা যায়নি', description, onRetry }) {
  function retry() {
    if (onRetry) onRetry()
    else window.location.reload()
  }

  return (
    <section className="ui-state ui-state--error" role="alert">
      <strong>{title}</strong>
      {description ? <p>{description}</p> : null}
      <button className="ui-button ui-button--secondary" type="button" onClick={retry}>আবার চেষ্টা করুন</button>
    </section>
  )
}
