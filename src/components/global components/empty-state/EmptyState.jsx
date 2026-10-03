export default function EmptyState({ title = 'কোনো তথ্য পাওয়া যায়নি', description }) {
  return (
    <section className="ui-state" aria-live="polite">
      <strong>{title}</strong>
      {description ? <p>{description}</p> : null}
    </section>
  )
}
