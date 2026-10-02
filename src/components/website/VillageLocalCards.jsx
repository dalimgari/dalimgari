import { useEffect, useMemo, useState } from 'react'
import { usePreferences } from '../../context/PreferencesContext'
import { getVillageWeather } from '../../services/villageLocalInfoService'

const WEATHER_BN = {
  0: 'পরিষ্কার আকাশ', 1: 'মূলত পরিষ্কার', 2: 'আংশিক মেঘলা', 3: 'মেঘলা',
  45: 'কুয়াশা', 48: 'কুয়াশা', 51: 'হালকা গুঁড়ি বৃষ্টি', 53: 'গুঁড়ি বৃষ্টি', 55: 'ঘন গুঁড়ি বৃষ্টি',
  61: 'হালকা বৃষ্টি', 63: 'বৃষ্টি', 65: 'ভারী বৃষ্টি', 71: 'হালকা তুষার', 73: 'তুষার', 75: 'ভারী তুষার',
  80: 'বৃষ্টির ঝাপটা', 81: 'বৃষ্টির ঝাপটা', 82: 'ভারী বৃষ্টির ঝাপটা',
  95: 'বজ্রসহ বৃষ্টি', 96: 'বজ্রসহ শিলাবৃষ্টি', 99: 'বজ্রসহ শিলাবৃষ্টি',
}
const WEATHER_EN = {
  0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
  45: 'Fog', 48: 'Fog', 51: 'Light drizzle', 53: 'Drizzle', 55: 'Dense drizzle',
  61: 'Light rain', 63: 'Rain', 65: 'Heavy rain', 71: 'Light snow', 73: 'Snow', 75: 'Heavy snow',
  80: 'Rain showers', 81: 'Rain showers', 82: 'Heavy rain showers',
  95: 'Thunderstorm', 96: 'Thunderstorm with hail', 99: 'Thunderstorm with hail',
}


function informationForLocation(location, language) {
  const parts = [location.union, location.upazila, location.district, location.division].filter(Boolean)
  const lat = Number(location.latitude).toFixed(4)
  const lon = Number(location.longitude).toFixed(4)
  return (
    <>
      {parts.length ? <p className="village-local-card__address">{parts.join(language === 'bng' ? ' • ' : ' • ')}</p> : null}
      {Number.isFinite(Number(location.latitude)) && Number.isFinite(Number(location.longitude))
        ? <p className="village-local-card__coordinates">{language === 'bng' ? 'স্থানাঙ্ক: ' : 'Coordinates: '}{lat}, {lon}</p>
        : null}
    </>
  )
}

const BENGALI_DIGITS = '০১২৩৪৫৬৭৮৯'

function toBengaliDigits(value) {
  return String(value).replace(/[0-9]/g, (digit) => BENGALI_DIGITS[Number(digit)])
}

function getTimeParts(date, timeZone) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  }).formatToParts(date)
  return Object.fromEntries(parts.filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]))
}

function getGregorianDateParts(date, timeZone) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone, day: 'numeric', month: 'numeric', year: 'numeric',
  }).formatToParts(date)
  return Object.fromEntries(parts.filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]))
}

// Bangladesh's current revised Bangla calendar: Pohela Boishakh is 14 April;
// the first five months have 31 days, Ashwin through Magh have 30,
// Falgun has 29 (30 in Gregorian leap years), and Chaitra has 30.
const BENGALI_MONTHS = ['বৈশাখ', 'জ্যৈষ্ঠ', 'আষাঢ়', 'শ্রাবণ', 'ভাদ্র', 'আশ্বিন', 'কার্তিক', 'অগ্রহায়ণ', 'পৌষ', 'মাঘ', 'ফাল্গুন', 'চৈত্র']

function isGregorianLeapYear(year) {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
}

function getBengaliDate(date, timeZone) {
  const { day, month, year } = getGregorianDateParts(date, timeZone)
  const gYear = Number(year)
  const gMonth = Number(month)
  const gDay = Number(day)

  // Bangla year changes on 14 April.
  const banglaYear = gMonth > 4 || (gMonth === 4 && gDay >= 14) ? gYear - 593 : gYear - 594
  const start = Date.UTC(gYear - (gMonth < 4 || (gMonth === 4 && gDay < 14) ? 1 : 0), 3, 14)
  const current = Date.UTC(gYear, gMonth - 1, gDay)
  let dayOfYear = Math.floor((current - start) / 86400000) + 1
  const lengths = [31, 31, 31, 31, 30, 30, 30, 30, 30, 30, isGregorianLeapYear(gYear) ? 30 : 29, 30]
  let monthIndex = 0
  while (dayOfYear > lengths[monthIndex]) {
    dayOfYear -= lengths[monthIndex]
    monthIndex += 1
  }

  return { day: dayOfYear, month: BENGALI_MONTHS[monthIndex], year: banglaYear }
}

function TimeCard({ location, language }) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  const parts = getTimeParts(now, location.timeZone)
  const rawTime = `${parts.hour}:${parts.minute}:${parts.second}`
  const time = language === 'bng' ? toBengaliDigits(rawTime) : rawTime
  const weekday = new Intl.DateTimeFormat(language === 'bng' ? 'bn-BD' : 'en-BD', {
    timeZone: location.timeZone, weekday: 'long',
  }).format(now)

  const date = language === 'bng'
    ? (() => {
        const bengali = getBengaliDate(now, location.timeZone)
        return `${toBengaliDigits(bengali.day)} ${bengali.month} ${toBengaliDigits(bengali.year)}`
      })()
    : new Intl.DateTimeFormat('en-BD', {
        timeZone: location.timeZone, day: 'numeric', month: 'long', year: 'numeric',
      }).format(now)

  return (
    <article className="village-local-card village-local-card--time">
      <div className="village-local-card__icon" aria-hidden="true">◷</div>
      <div>
        <p className="village-local-card__eyebrow">{language === 'bng' ? 'স্থানীয় সময়' : 'Local time'}</p>
        <h2>{time}</h2>
        <p className="village-local-card__date">{weekday}, {date}</p>
        <div className="village-local-card__location">
          <strong>{language === 'bng' ? 'অবস্থান' : 'Location'}</strong>
          <p className="village-local-card__place">{language === 'bng' ? location.nameBn : location.nameEn}</p>
          {informationForLocation(location, language)}
        </div>
      </div>
    </article>
  )
}

function WeatherCard({ weather, language }) {
  const current = weather?.current
  if (!current) return (
    <article className="village-local-card village-local-card--weather">
      <div className="village-local-card__icon" aria-hidden="true">☁</div>
      <div>
        <p className="village-local-card__eyebrow">{language === 'bng' ? 'আবহাওয়া' : 'Weather'}</p>
        <h2>{language === 'bng' ? 'তথ্য পাওয়া যাচ্ছে না' : 'Weather unavailable'}</h2>
      </div>
    </article>
  )

  const code = Number(current.weather_code)
  const description = (language === 'bng' ? WEATHER_BN : WEATHER_EN)[code] || (language === 'bng' ? 'আবহাওয়ার অবস্থা' : 'Weather conditions')
  const temperature = Math.round(Number(current.temperature_2m))
  const feels = Math.round(Number(current.apparent_temperature))
  const humidity = Math.round(Number(current.relative_humidity_2m))
  const wind = Math.round(Number(current.wind_speed_10m))

  return (
    <article className="village-local-card village-local-card--weather">
      <div className="village-local-card__icon" aria-hidden="true">☁</div>
      <div className="village-local-card__weather-body">
        <p className="village-local-card__eyebrow">{language === 'bng' ? 'আজকের আবহাওয়া' : "Today's weather"}</p>
        <div className="village-local-card__temperature">
          <strong>{temperature}°</strong><span>{language === 'bng' ? 'সে.' : 'C'}</span>
        </div>
        <p className="village-local-card__condition">{description}</p>
        <div className="village-local-card__stats">
          <span>{language === 'bng' ? 'অনুভূত ' : 'Feels '} {feels}°{language === 'bng' ? 'সে.' : 'C'}</span>
          <span>{language === 'bng' ? 'আর্দ্রতা ' : 'Humidity '} {humidity}%</span>
          <span>{language === 'bng' ? 'বাতাস ' : 'Wind '} {wind} {language === 'bng' ? 'কিমি/ঘণ্টা' : 'km/h'}</span>
        </div>
        <p className="village-local-card__place">{language === 'bng' ? weather.location.nameBn : weather.location.nameEn}</p>
      </div>
    </article>
  )
}

export default function VillageLocalCards({ information }) {
  const { language, theme } = usePreferences()
  const [weather, setWeather] = useState(null)

  const location = useMemo(() => {
    const value = weather?.location
    return value || {
      nameBn: information?.village_name || 'ডালিমগাড়ী',
      nameEn: 'Dalimgari',
      latitude: 25.2168,
      longitude: 89.197,
      timeZone: 'Asia/Dhaka',
      division: information?.division || '',
      district: information?.district || '',
      upazila: information?.upazila_name || '',
      union: information?.union_name || '',
    }
  }, [information?.village_name, weather?.location])

  useEffect(() => {
    let active = true
    getVillageWeather(information || {})
      .then((value) => { if (active) setWeather(value) })
      .catch(() => { if (active) setWeather(null) })
    return () => { active = false }
  }, [information])

  return (
    <section className="home-section village-local-section" data-theme={theme} aria-labelledby="village-local-title">
      <div className="site-container">
        <h2 id="village-local-title" className="sr-only">{language === 'bng' ? 'স্থানীয় তথ্য' : 'Local information'}</h2>
        <div className="village-local-grid">
          <TimeCard location={location} language={language} />
          <WeatherCard weather={weather} language={language} />
        </div>
      </div>
    </section>
  )
}
