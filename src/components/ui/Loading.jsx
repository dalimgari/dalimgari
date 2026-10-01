export default function Loading({ label = 'লোড হচ্ছে…' }) {
  return <div className="ui-state" role="status" aria-live="polite">{label}</div>
}
