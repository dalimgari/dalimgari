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

  const rawMapLocation = String(information.map_location || '').trim()
  const coordinateMatch = rawMapLocation.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/) || rawMapLocation.match(/[?&](?:q|query|ll)=(-?\d+(?:\.\d+)?)[,%20]+(-?\d+(?:\.\d+)?)/) || rawMapLocation.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/)
  const mapQuery = coordinateMatch ? coordinateMatch[1] + ',' + coordinateMatch[2] : rawMapLocation
  const mapSrc = rawMapLocation ? (rawMapLocation.includes('output=embed') ? rawMapLocation : 'https://www.google.com/maps?q=' + encodeURIComponent(mapQuery) + '&output=embed') : ''

  return (
    <section className="home-section" aria-labelledby="village-information-title">
      <div className="site-container">
        <h2 id="village-information-title">সাধারণ তথ্য</h2>
        {items.length ? (
          <dl className="information-document">
            {items.map(([label, value]) => (
              <div className="information-document__row" key={label}>
                <dt>{label}</dt>
                <dd>{key === 'map_location' ? <div className="information-map"><iframe className="information-map__frame" src={mapSrc} title="গ্রামের মানচিত্র" loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen /></div> : String(value)}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p>এখনও তথ্য যোগ করা হয়নি।</p>
        )}
      </div>
    </section>
  )
}