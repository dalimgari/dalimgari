export default function Navigation({ items = [] }) {
  return (
    <nav className="site-nav" aria-label="প্রধান নেভিগেশন">
      <div className="site-container site-nav__inner">
        {items.map((item) => (
          <a key={item.href} className="site-nav__link" href={item.href}>
            {item.label}
          </a>
        ))}
      </div>
    </nav>
  )
}
