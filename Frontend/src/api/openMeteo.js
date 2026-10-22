// Talks to Open-Meteo straight from the visitor's browser.
// This is the backup route: it is used only when our server cannot get data
// (for example when Open-Meteo has used up the free limit of the server's shared IP address).
// Every visitor has their own IP address, so every visitor has their own free limit.

const GEO_URL = 'https://geocoding-api.open-meteo.com/v1/search'
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast'
const TIMEOUT_MS = 10000
const SEARCH_TTL = 10 * 60 * 1000

// Errors look like the ones axios makes, so the rest of the app handles both the same way
const fail = (message, status) => {
  const error = new Error(message)
  error.response = { status, data: { message } }
  return error
}

async function getJson(url, signal) {
  const timer = new AbortController()
  const timeout = setTimeout(() => timer.abort(), TIMEOUT_MS)
  const onAbort = () => timer.abort()
  signal?.addEventListener('abort', onAbort, { once: true })
  if (signal?.aborted) timer.abort()

  try {
    const res = await fetch(url, { signal: timer.signal })
    if (res.status === 429) {
      throw fail('The weather provider is busy right now. Please try again in a few minutes.', 503)
    }
    if (!res.ok) throw fail('The weather service is unavailable right now.', 502)
    return await res.json()
  } catch (err) {
    if (err.response) throw err
    if (signal?.aborted) {
      const canceled = new Error('canceled')
      canceled.code = 'ERR_CANCELED' // same code axios uses, so callers can ignore it
      throw canceled
    }
    throw fail('Could not reach the weather service. Check your connection and try again.', 502)
  } finally {
    clearTimeout(timeout)
    signal?.removeEventListener('abort', onAbort)
  }
}

const mapPlace = (r) => ({
  id: r.id,
  name: r.name,
  admin1: r.admin1,
  admin2: r.admin2,
  country: r.country,
  countryCode: r.country_code,
  latitude: r.latitude,
  longitude: r.longitude,
  population: r.population,
  timezone: r.timezone,
})

const searchCache = new Map() // lowercase text -> { items, at }

// Suggestions for the search box (same shape as the server's /weather/search)
export async function directSearch(query, signal) {
  const q = query.trim()
  if (q.length < 2) return []

  const key = q.toLowerCase()
  const hit = searchCache.get(key)
  if (hit && Date.now() - hit.at < SEARCH_TTL) return hit.items

  const data = await getJson(
    `${GEO_URL}?name=${encodeURIComponent(q)}&count=10&language=en&format=json`,
    signal
  )
  const items = (data.results ?? []).map(mapPlace)
  searchCache.set(key, { items, at: Date.now() })
  if (searchCache.size > 100) searchCache.delete(searchCache.keys().next().value)
  return items
}

// The same fields the server asks for, so the answer looks exactly like the server's
const forecastParams = ({ latitude, longitude }) =>
  new URLSearchParams({
    latitude,
    longitude,
    current: [
      'temperature_2m',
      'apparent_temperature',
      'relative_humidity_2m',
      'is_day',
      'precipitation',
      'cloud_cover',
      'pressure_msl',
      'wind_speed_10m',
      'wind_direction_10m',
      'weather_code',
    ].join(','),
    hourly: 'temperature_2m,weather_code,precipitation_probability',
    daily: [
      'weather_code',
      'temperature_2m_max',
      'temperature_2m_min',
      'sunrise',
      'sunset',
      'uv_index_max',
      'precipitation_probability_max',
    ].join(','),
    timezone: 'auto',
    forecast_days: '7',
    forecast_hours: '24',
  })

const buildResult = ({ name, country, admin1, latitude, longitude }, forecast) => ({
  city: name,
  country,
  admin1,
  latitude,
  longitude,
  timezone: forecast.timezone,
  utcOffsetSeconds: forecast.utc_offset_seconds,
  current: forecast.current,
  hourly: forecast.hourly,
  daily: forecast.daily,
  stale: false,
})

// place: a city name (string) OR a place object { name, country, admin1, latitude, longitude }
export async function directWeather(place) {
  let target = place

  if (typeof place === 'string') {
    const data = await getJson(
      `${GEO_URL}?name=${encodeURIComponent(place.trim())}&count=1&language=en&format=json`
    )
    if (!data.results || data.results.length === 0) throw fail('City not Found', 404)
    const { name, country, admin1, latitude, longitude } = data.results[0]
    target = { name, country, admin1, latitude, longitude }
  }

  const forecast = await getJson(`${FORECAST_URL}?${forecastParams(target)}`)
  return buildResult(target, forecast)
}