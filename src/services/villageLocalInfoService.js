const DEFAULT_LOCATION = {
  nameBn: 'ডালিমগাড়ী',
  nameEn: 'Dalimgari',
  latitude: 25.2168,
  longitude: 89.197,
  timeZone: 'Asia/Dhaka',
}

export function resolveVillageLocation(information = {}) {
  const raw = String(information.map_location || '')
  const matches = raw.match(/(-?\\d+(?:\\.\\d+)?)\\s*[,;]\\s*(-?\\d+(?:\\.\\d+)?)/)
  if (!matches) return { ...DEFAULT_LOCATION, nameBn: information.village_name || DEFAULT_LOCATION.nameBn, division: information.division || '', district: information.district || '', upazila: information.upazila_name || '', union: information.union_name || '' }

  const latitude = Number(matches[1])
  const longitude = Number(matches[2])
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return { ...DEFAULT_LOCATION }

  return {
    ...DEFAULT_LOCATION,
    latitude,
    longitude,
    nameBn: information.village_name || DEFAULT_LOCATION.nameBn,
    nameEn: DEFAULT_LOCATION.nameEn,
    division: information.division || '',
    district: information.district || '',
    upazila: information.upazila_name || '',
    union: information.union_name || '',
  }
}

export async function getVillageWeather(information = {}) {
  const location = resolveVillageLocation(information)
  const url = new URL('https://api.open-meteo.com/v1/forecast')
  url.searchParams.set('latitude', location.latitude)
  url.searchParams.set('longitude', location.longitude)
  url.searchParams.set('current', 'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m')
  url.searchParams.set('timezone', location.timeZone)
  url.searchParams.set('forecast_days', '1')

  const response = await fetch(url)
  if (!response.ok) throw new Error('Weather service unavailable')
  const data = await response.json()

  return { location, current: data.current || null }
}

export const DEFAULT_VILLAGE_LOCATION = DEFAULT_LOCATION
