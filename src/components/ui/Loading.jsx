import Skeleton from './Skeleton'

export default function Loading({ label = 'লোড হচ্ছে…', variant = 'page' }) {
  return <Skeleton label={label} variant={variant} />
}
