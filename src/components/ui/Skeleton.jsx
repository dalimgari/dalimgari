export default function Skeleton({ variant = 'page', label = 'লোড হচ্ছে…' }) {
  const isDetail = variant === 'detail'
  const cardCount = isDetail ? 2 : 6

  return (
    <div className={`ui-skeleton ui-skeleton--${variant}`} role="status" aria-live="polite" aria-label={label}>
      <span className="ui-skeleton__sr-only">{label}</span>
      <div className="ui-skeleton__heading" aria-hidden="true">
        <span className="ui-skeleton__line ui-skeleton__line--title" />
        <span className="ui-skeleton__line ui-skeleton__line--short" />
      </div>
      {variant === 'home' ? (
        <div className="ui-skeleton__hero" aria-hidden="true">
          <span className="ui-skeleton__line ui-skeleton__line--hero-title" />
          <span className="ui-skeleton__line ui-skeleton__line--wide" />
          <span className="ui-skeleton__line ui-skeleton__line--medium" />
        </div>
      ) : null}
      <div className={`ui-skeleton__grid ui-skeleton__grid--${isDetail ? 'detail' : 'cards'}`} aria-hidden="true">
        {Array.from({ length: cardCount }, (_, index) => (
          <div className="ui-skeleton__card" key={index}>
            <span className="ui-skeleton__block" />
            <span className="ui-skeleton__line" />
            <span className="ui-skeleton__line ui-skeleton__line--medium" />
          </div>
        ))}
      </div>
    </div>
  )
}
