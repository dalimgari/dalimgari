export default function ErrorState({ title = 'তথ্য লোড করা যায়নি', description }) {
  return (
    <section className="ui-state ui-state--error" role="alert">
      <strong>{title}</strong>
      {description ? <p>{description}</p> : null}
    </section>
  )
}
