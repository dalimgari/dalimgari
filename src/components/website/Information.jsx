const LOCATION_FIELDS = [
  ['division', 'বিভাগ'],
  ['district', 'জেলা'],
  ['upazila_name', 'উপজেলা'],
  ['union_name', 'ইউনিয়ন'],
  ['postal_code', 'পোস্ট কোড'],
  ['population', 'জনসংখ্যা'],
  ['established_date', 'প্রতিষ্ঠার তারিখ'],
  ['map_location', 'মানচিত্রের অবস্থান'],
]

export default function Information({ information }) {
  if (!information) return null

  const items = LOCATION_FIELDS
    .map(([key, label]) => [label, information[key]])
    .filter(([, value]) => value !== null && value !== undefined && value !== '')

  return (
    <section className="home-section" aria-labelledby="village-information-title">
      <div className="site-container">
        <h2 id="village-information-title">গ্রামের তথ্য</h2>
        {items.length ? (
          <dl className="info-grid">
            {items.map(([label, value]) => (
              <div className="info-card" key={label}>
                <dt>{label}</dt>
                <dd>{String(value)}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p>এখনও গ্রামের তথ্য যোগ করা হয়নি।</p>
        )}
      </div>
    </section>
  )
}
